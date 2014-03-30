var EmpireBT = {};

EmpireBT.utils = {
    extend_class : function (base, sub) {
        //found on StackOverflow... liked it!
        sub.prototype = Object.create(base.prototype);
        sub.prototype.constructor = sub;
        Object.defineProperty(sub.prototype, 'constructor', { 
            enumerable: false, 
            value: sub 
        });
    }
};

EmpireBT.GameRunner = function GameRunner(game_data) {

    this.loadPlayer = function (player_data) {
        var units = [];
        for (var i in player_data.units) {
            var unit = player_data.units[i];
            if (unit.type in EmpireBT) {
                var obj = new EmpireBT[unit.type](player_data.id, unit.position, unit.direction);
                this.tiles[obj.posXyTo1D()].unit = obj;
                units.push(obj);
            }

        }
        return new EmpireBT.Player(
            player_data.id, player_data.sp_start, EmpireBT.GameRunner.MAX_TIME, player_data.units.length, 
            EmpireBT.GameRunner.SP_INITIAL, units, false);
    };

    this.loadTiles = function (tiles_data) {
        var tiles = [];
        for (var i in tiles_data) {
            var t = tiles_data[i];
            tiles.push(new EmpireBT.Tile(t.position, t.obstacle, t.is_hill));
        }
        return tiles;
    };

    this.tiles = this.loadTiles(game_data.tiles);
    this.player1 = this.loadPlayer(game_data.defender);
    this.player2 = this.loadPlayer(game_data.attacker);
    this.currentPlayer = this.player1;
    this.currentValidMoves = [];
    this.currentValidAttacks = [];

    this.processEvent = function (event_data, cb) {
        if (event_data.type + "Handler" in this) {
            this[event_data.type + "Handler"](event_data.data, cb);
        }
    };
    var reset_units = function (units) {
        for (var i in units) {
            var u = units[i];
            u.tryReset();
        }
    }
    this.startTurnHandler = function (event_data, cb) {
        var results = {
            general_data : {
                current_player_sp : 0,

            }
        };
        this.currentPlayer.currentSp = 
            this.currentPlayer.currentSp + EmpireBT.GameRunner.SP_PER_TURN >= EmpireBT.GameRunner.MAX_SP_PER_PLAYER
            ? EmpireBT.GameRunner.MAX_SP_PER_PLAYER
            : this.currentPlayer.currentSp + EmpireBT.GameRunner.SP_PER_TURN;
        this.currentPlayer.currentTurnSp = this.currentPlayer.currentSp;
        results.general_data.current_player_sp = this.currentPlayer.currentSp;
        //we do logic shit with results and event_data
        cb(results);
    };
    var health_control = function(units) {
        var result = {
            wounded : [],
            dead : [],
            spCasualties : 0
        }
        for (var i in units) {
            var u = units[i];
            if (u.health == 3 && u.isWounded) {
                result.wounded.push(u);
            }
            if (u.health == 1 && u.isWounded) {
                result.dead.push(u);
                result.spCasualties += u.sp;
            }
            if (u.isWounded) {
                u.health--;
            }
            if (u.health <= 0) {
                u.isAlive = false;   
            }
        }
    };
    this.endTurnHandler = function (event_data, cb) {
        var results = {};
        this.currentPlayer = this.currentPlayer == this.player1
            ? this.player2
            : this.player1;
        var curr_player_health_issues = health_control(this.currentPlayer.units);
        this.currentPlayer.spCasualties += curr_player_health_issues.spCasualties;
        //we do logic shit with results and event_data
        cb(results);
    };

    this.showMovesHandler = function (event_data, cb) {
        var results = {
            can_be_used : false,
            available_move_tiles : [],
            available_attack_tiles : []
        };

        var unit_position = event_data.unit_position;
        var unit = this.tiles[unit_position].unit;
        if (this.currentPlayer.currentTurnSp >= unit.sp && !unit.hasAttacked) {
            results.can_be_used = true;
            var x = unit.position.x; //5
            var y = unit.position.y; //5
                                     //3
            if (!unit.hasMoved && !unit.hasAttacked) {

                for (var i = 0; i <= unit.mov; i++) {
                    var suby = y - i;
                    //suby = 5 - 1
                    for (var subx = x - unit.mov + i; subx < x + unit.mov - i; subx++) {
                        if (subx < 0 || subx >= EmpireBT.GameRunner.BATTLEFIELD_X) continue;
                        if (suby < 0 || suby >= EmpireBT.GameRunner.BATTLEFIELD_Y) continue;

                        var pos1d = EmpireBT.GameRunner.posXyTo1D({ position : {x : subx, y: suby}});
                        var t = this.tiles[pos1d];

                        if (!t.isObstacle && t.unit == null) {
                            results.available_move_tiles.push(pos1d);
                        }
                    }
                    var suby2 = y + i;
                    if (suby == suby2) continue;
                    for (var subx = x - unit.mov + i; subx < x + unit.mov - i; subx++) {
                        if (subx < 0 || subx >= EmpireBT.GameRunner.BATTLEFIELD_X) continue;
                        if (suby2 < 0 || suby2 >= EmpireBT.GameRunner.BATTLEFIELD_Y) continue;
                        var pos1d = EmpireBT.GameRunner.posXyTo1D({ position : {x : subx, y: suby2}});
                        var t = this.tiles[pos1d];
                        if (!t.isObstacle && t.unit == null) {
                            results.available_move_tiles.push(pos1d);
                        }
                    }
                }
            }

            if (!unit.hasAttacked) {
                for (var i = 0; i <= unit.range; i++) {
                    var suby = y - i;
                    for (var subx = x - unit.range + i; subx < x + unit.range - i; subx++) {
                        if (subx < 0 || subx >= EmpireBT.GameRunner.BATTLEFIELD_X) continue;
                        if (suby < 0 || suby >= EmpireBT.GameRunner.BATTLEFIELD_Y) continue;

                        var pos1d = EmpireBT.GameRunner.posXyTo1D({ position : {x : subx, y: suby}});
                        var t = this.tiles[pos1d];
                        if (t.unit != null) {
                            results.available_attack_tiles.push(pos1d);
                        }
                    }
                    var suby2 = y + i;
                    if (suby == suby2) continue;
                    for (var subx = x - unit.range + i; subx < x + unit.range - i; subx++) {
                        if (subx < 0 || subx >= EmpireBT.GameRunner.BATTLEFIELD_X) continue;
                        if (suby2 < 0 || suby2 >= EmpireBT.GameRunner.BATTLEFIELD_Y) continue;
                        var pos1d = EmpireBT.GameRunner.posXyTo1D({ position : {x : subx, y: suby2}});
                        var t = this.tiles[pos1d];
                        if (t.unit != null) {
                            results.available_attack_tiles.push(pos1d);
                        }
                    }
                }
            }
            
        }
        this.currentValidMoves = results.available_move_tiles;
        this.currentValidAttacks = results.available_attack_tiles;
        cb(results);
    };

    this.updateHandler = function (event_data, cb) {
        var results = {

        };
        var origi_pos = event_data.from_position;
        var pos = event_data.to_position;
        var origi_tile = this.tiles[origi_pos];
        var tile = this.tiles[pos];
        this.currentTurnSp -= origi_tile.unit.sp;
        var got_it = this.currentValidMoves.some(function (tpos) {
            if (tpos == pos) {
                //update unit and tile
                tile.unit = origi_tile.unit;
                origi_tile.unit = null;
                tile.unit.hasMoved = true;
                cb(results);
                return true;
            }
        });
        if (got_it) return;
        this.currentValidAttacks.some(function (tpos) {
            if (tpos == pos) {
                //update unit and tile
                tile.unit.isWounded = true;
                origi_tile.unit.hasAttacked = true;
                cb(results);
                return true
            }
        });
    };
}
EmpireBT.GameRunner.posXyTo1D = function (posxy) {
    return posxy.position.y * EmpireBT.GameRunner.BATTLEFIELD_X + posxy.position.x;
};
EmpireBT.GameRunner.BATTLEFIELD_X = 24;
EmpireBT.GameRunner.BATTLEFIELD_Y = 20;
EmpireBT.GameRunner.MAX_UNIT_NUM = 80;
EmpireBT.GameRunner.MAX_SP_VALUE = 400;
EmpireBT.GameRunner.SP_INITIAL = 10;
EmpireBT.GameRunner.TURNS_IN_HILL = 5;
EmpireBT.GameRunner.SP_PER_TURN = 5;
EmpireBT.GameRunner.MAX_SP_PER_PLAYER = 50;
EmpireBT.GameRunner.SP_CAP_CMDR_RAISE = 5;
EmpireBT.GameRunner.SP_DRUMMER = 5;
EmpireBT.GameRunner.HILL_X = 4;
EmpireBT.GameRunner.HILL_Y = 3;
EmpireBT.GameRunner.MAX_TIME = 30*60*1000;

EmpireBT.Unit = function (owner_id, pos, dir, mov, range, sp, hit_probability, unit_type, extra) {
    this.mov = mov;
    this.range = range;
    this.sp = sp;
    this.hitProbability = hit_probability;
    this.extra = extra;
    this.health = 3;
    this.isAlive = true;
    this.isWounded = false;
    this.hasAttacked = false;
    this.hasMoved = false;
    this.direction = dir;
    this.position = pos;
    this.ownerId = owner_id;
    this.type = unit_type;
    //extra = { has_effect : true, ranged : false }
    this.tryReset = function() {
        if (!this.isWounded && this.isAlive) {
            this.hasMoved = false;
            this.hasAttacked = false;
        }
    };
    this.posXyTo1D = function () {
        return this.position.y * EmpireBT.GameRunner.BATTLEFIELD_X + this.position.x;
    };
    this.comparePosition = function (pos) {
        return this.position.x == pos.x && this.position.y == pos.y;
    };
}
EmpireBT.Unit.directions = {
    UP : 'up',
    DOWN : 'down',
    LEFT : 'left',
    RIGHT : 'right'
};

// var units_with_effect = {
//     '' : true
// };
EmpireBT.Soldier = function (owner_id, pos, dir) {
    var a = "";
    EmpireBT.Unit.call(this, owner_id, pos, dir, 
        EmpireBT.Soldier.MOV, EmpireBT.Soldier.RANGE, EmpireBT.Soldier.SP, 
        EmpireBT.Soldier.HIT, EmpireBT.Soldier.TYPE, {});
}
EmpireBT.utils.extend_class(EmpireBT.Unit, EmpireBT.Soldier);
EmpireBT.Soldier.MOV = 4;
EmpireBT.Soldier.RANGE = 1;
EmpireBT.Soldier.SP = 5;
EmpireBT.Soldier.HIT = 100;
EmpireBT.Soldier.TYPE = 'soldier';

EmpireBT.Hoplite = function (owner_id, pos, dir) {
    EmpireBT.Unit.call(this, owner_id, pos, dir, 
        EmpireBT.Hoplite.MOV, EmpireBT.Hoplite.RANGE, EmpireBT.Hoplite.SP, 
        EmpireBT.Hoplite.HIT, EmpireBT.Hoplite.TYPE, {});
}
EmpireBT.utils.extend_class(EmpireBT.Unit, EmpireBT.Hoplite);
EmpireBT.Hoplite.MOV = 3;
EmpireBT.Hoplite.RANGE = 1;
EmpireBT.Hoplite.SP = 6;
EmpireBT.Hoplite.HIT = 100;
EmpireBT.Hoplite.TYPE = 'hoplite';
// function Knight() {
//    Unit.call(this, EmpireBT.Knight.MOV, EmpireBT.Knight.RANGE, EmpireBT.Knight.SP, EmpireBT.Knight.HIT, EmpireBT.Knight.TYPE, {});    
// }
// EmpireBT.utils.extend_class(Unit, Knight);
// Knight.MOV = 7;
// Knight.RANGE = 1;
// Knight.SP = 8;
// Knight.HIT = 100;
// Knight.TYPE = 'knight';

EmpireBT.Archer = function (owner_id, pos, dir) {
    EmpireBT.Unit.call(this, owner_id, pos, dir, 
        EmpireBT.Archer.MOV, EmpireBT.Archer.RANGE, EmpireBT.Archer.SP, 
        EmpireBT.Archer.HIT, EmpireBT.Archer.TYPE, { ranged : true });
}
EmpireBT.utils.extend_class(EmpireBT.Unit, EmpireBT.Archer);
EmpireBT.Archer.MOV = 3;
EmpireBT.Archer.RANGE = 5;
EmpireBT.Archer.SP = 8;
EmpireBT.Archer.HIT = 20;
EmpireBT.Archer.TYPE = 'archer';
//function Drummer()
 

EmpireBT.Player = function (id, sp_start, available_time, unit_number, 
                current_sp, units, effect_flags) {
    this.id = id;
    this.spStart = sp_start;
    this.availableTime = available_time;
    this.unitNumber = unit_number;
    this.currentSp = current_sp;
    this.currentTurnSp = this.currentSp;
    this.spCasualties = 0;
    this.units = units;
    this.effectFlags = effect_flags;
}

EmpireBT.Tile = function (pos, obstacle, is_hill) {
    this.position = pos;
    this.isObstacle = obstacle;
    this.isHill = is_hill;
    this.unit = null;
}

EmpireBT.Tile.prototype.comparePosition = EmpireBT.Unit.prototype.comparePosition;
EmpireBT.Tile.prototype.posXyTo1D = EmpireBT.Unit.prototype.posXyTo1D;
module.exports=EmpireBT.GameRunner;