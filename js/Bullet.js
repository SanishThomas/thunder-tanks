function Bullet(tt, bulletIndex, startx, starty, targetx, targety, speed) {
    var SELF = this;

    /** @type ThunderTanks */
    this.tt = tt;
	this.x = startx || this.game.width/2;
	this.y = starty || this.game.height/2;

    /** @type JSGameSoup */
    this.game = tt.game;

    var _private = {
        bulletIndex: bulletIndex,
        x: startx || this.game.width/2,
        y: starty || this.game.height/2,
        targetx: targetx || this.game.random(0,this.game.width),
        targety: targety || this.game.random(0,this.game.height),
        speed: 5,
        radius: 20,
        angle: MathUtil.getAngle(startx,starty,targetx,targety),
        bounces: 1,
        animation: new Sprite(["center","center"], {
            "move": [[SELF.tt.urlPath + '/images/bullet1.png', 7],[SELF.tt.urlPath + '/images/bullet2.png', 7]]
        }, function() {
            _private.animation.action("move");
            _private.animation.angle(_private.angle);
        })
    };

    var _events = {
        /** change direction of bullet (anvil is the entity the bullet is hitting) */
        richochet: function(anvil) { // take your aim, fire away, fire away!
            entity_aabb = anvil.get_collision_aabb();
            bullet_aabb = SELF.get_collision_aabb();

            var topDiff = Math.abs(entity_aabb[1] - bullet_aabb[1]);
            var bottomDiff = Math.abs(entity_aabb[1] + entity_aabb[3] - bullet_aabb[1] + bullet_aabb[3]);
            var leftDiff = Math.abs(entity_aabb[0] - bullet_aabb[0]);
            var rightDiff = Math.abs(entity_aabb[0] + entity_aabb[2] - bullet_aabb[0] + bullet_aabb[2]);

            // if bullet is between entity top and bottom, its probably a side collision
            if (topDiff < leftDiff && topDiff < rightDiff ||
                bottomDiff < leftDiff && bottomDiff < rightDiff) {
                _private.angle *= -1;
            } else {
                _private.angle = MathUtil.degreesToRadians(180 - MathUtil.radiansToDegrees(_private.angle));
            }
            _private.animation.angle(_private.angle);
        }
    }

    /**
     * @param {JSGameSoup} gs JSGameSoup instance
     */
    this.update = function(gs) {
        // move bullet
        _private.x = _private.x + _private.speed * Math.cos(_private.angle);
        _private.y = _private.y + _private.speed * Math.sin(_private.angle);

        // update sprite
        _private.animation.update();
		
		var numPoints = 8;
		var points = [];
		for (var i = 0; i < numPoints; i++){
            var x = _private.radius * Math.sin(i * Math.PI / (numPoints / 2));
            var y = _private.radius * Math.cos(i * Math.PI / (numPoints / 2));
            points.push([x, y]);
        }	
		_private.poly = points;
    }

    /**
     * @param {CanvasRenderingContext2D} c canvas context
     * @param {JSGameSoup} gs JSGameSoup instance
     */
    this.draw = function(c, gs) {
        // draw bullet
        c.beginPath();
        c.arc(_private.x, _private.y, _private.radius + 1, 0, 2 * Math.PI, false);
        c.lineWidth = 1;
        c.stroke();

        // draw sprite
        c.save(); //save the current draw state
        _private.animation.draw(c,[_private.x,_private.y]);
        c.restore(); //restore the previous draw state
		
		var poly = this.get_collision_poly();
		c.translate(_private.x, _private.y);
		c.strokeStyle = '#ff00ff';			
		c.beginPath();
		c.moveTo(poly[0][0],poly[0][1]);
		for(var p = 1; p < poly.length; p++) {
		  c.lineTo(poly[p][0],poly[p][1]);
		}
		c.closePath();
		c.stroke();
    }

    this.kill = function() {
        this.tt.removeBullet(_private.bulletIndex);
    }

    /* @returns[Array] a rectangle of the boundaries of the entity with the form [x, y, w, h] */
    this.get_collision_aabb = function() {
        return [_private.x, _private.y, _private.radius, _private.radius];
    }

    /* @returns {Array} the center of the circle and the radius like this: return [[x, y], r] */
    this.get_collision_circle = function() {
        return [[_private.x,_private.y],_private.radius];
    }

    /** @returns {Array}  An array of lines of the form [[x1, y1], [x2, y2], ... [xn, yn]] */
    this.get_collision_poly = function() {	
		return _private.poly;
    }

    this.collide_aabb = function(entity, result) {
        // bullet vs bullet (handled in collide_circle)

        // bullet vs tank = dead
        if (entity instanceof Tank) {
            SELF.kill();

        // bullet vs obstacle = bounce or die
        } else if (entity instanceof Block || entity instanceof Poly) {
            if (!_private.bounces) {
                this.kill();
            } else {
                _private.bounces--;
            }

            _events.richochet(entity);

            //if (entity instanceof Poly) {
            //    var polycollision = collide.collide_poly_entities(this,entity);
            //    if (polycollision) {
            //        _events.richochet(entity);
            //    }
            //} else {
            //    _events.richochet(entity);
            //}
        }
    }

    this.collide_circle = function(entity, result) {
        if (entity !== this) {
            this.kill();
        }
    }

    this.collide_polygon = function(entity, result) {
        console.log('bullet collide_polygon', entity, result);
    }
}