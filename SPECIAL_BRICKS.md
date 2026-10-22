# Extreme Bricks - Special Bricks Documentation

This document provides a breakdown of the grid architecture and each brick type available in **Extreme Bricks**, including visual identity, gameplay mechanics, spawn probabilities, and sensory feedback (audio/visual).

---

## Grid Architecture & Spawn Distribution
- **Grid Size**: **6 columns × 5 rows** (**30 total bricks** per round).
- **Corridors & Top Gap**:
  - **Top Gap**: 1 brick tall gap from the header line (`HEADER_HEIGHT = 250px`, `GRID_START_Y = 318px`, providing 68px vertical clearance) allowing the 32px diameter ball to pass above the bricks and bounce between the ceiling line and the top row of bricks.
  - **Left & Right Corridors**: Centered 6-column layout with 106px open gaps on both left (`x = 0..106px`) and right (`x = 794..900px`), giving ample space for balls to slide past either side and loop behind the brick formation.
- **Special Bricks per Round**: **Minimum half the bricks are special bricks** (at least 15 out of 30 bricks, randomly 15 to 19 special bricks, ~50%–63% of the grid).
- **Debuff Brick Guarantee**: **Each round is guaranteed to have at least one debuff brick** (`ichinose`, `akuta`, `sui`, `magata`, or `ruriiro`).
- **Normal Bricks**: **11–15 normal bricks** per round (~37%–50% of the grid). Out of these normal bricks, a random count (between 3 and 6) are reinforced as **Hard Bricks** (`images/brick_hard.webp`).
- **Individual Randomization**: Each of the special brick slots is individually randomized across the weighted special types pool.
- **Explosion Interaction**: When a special brick is caught in an explosion (from a **Q Brick**), **its special skill effect activates immediately** as well (including cascading Q bomb explosions, board extensions, multiball spawns, shields, and magnetism)!

---

## Quick Reference Table

| Brick Type | Image Asset | Effect Summary | Duration / Limit | Special Slot Chance | SFX Triggered |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **Normal Brick** | `images/brick_normal.webp` | Standard brick. Grants +10 points when destroyed. | Permanent | ~6–12 of 30 | `audio/hit.mp3` |
| **Hard Brick** *(2-Hit Normal Brick)* | `images/brick_hard.webp` → `images/brick_cracked.webp` | Reinforced normal brick requiring **2 hits** to break. Turns into cracked brick (`images/brick_cracked.webp`) on 1st hit; destroys on 2nd hit. Grants **+30 points** instead of 10. | Permanent (2 Hits) | Random 3–6 of Normal pool | `audio/hit.mp3` |
| **Yo Brick** *(Board Extender)* | `images/brick_yo.webp` | Widens paddle from 215px to 284px and equips extended sprite. | **30 Seconds** (Timer resets if another Yo brick is broken) | ~15.5% | `audio/special_brick.mp3` |
| **Zero Brick** *(3-Bounce Zero Heart Extra Life)* | `images/brick_zero.webp` | Drops a **Zero Heart** (`images/zero_heart.webp`, resized to ball size) that must be bounced on the paddle **3 times** to transform into an extra life (max 3 lives). Heavy physics; does not hit bricks; does not destroy Kazuki shield; unaffected by gravity field. | **3 Paddle Bounces** (Max 3 Lives) | **~7.0%** (Rarest special brick) | `audio/special_brick.mp3` |
| **Tsuki Brick** *(Magnetism)* | `images/brick_tsuki.webp` | Grants magnetism to the **next 1 closest brick** to the paddle. | **1 Brick** (Single ball binding) | ~15.5% | `audio/special_brick.mp3` |
| **Q Brick** *(Bomb Blast)* | `images/brick_q.webp` | Explodes all adjacent bricks (activates special skills on hit!). | Instant | ~15.5% | `audio/explode.mp3` |
| **Kazuki Brick** *(Neon Shield)* | `images/brick_kazuki.webp` | Deploys an animated digital jagged neon light blue shield line beneath player board that scrolls to the right and loops. Deflects ball safely; disappears after **1 hit** or **15 seconds**. | **15 Seconds or 1 Hit** | ~15.5% | `audio/special_brick.mp3` |
| **Miu Brick** *(Dual Turrets)* | `images/brick_miu.webp` | Summons dual side turrets on the board that fire upward lasers every time a ball bounces on the board. | **30 Seconds** | ~15.5% | `audio/special_brick.mp3` & `audio/laser.mp3` |
| **Jio Brick** *(Toxic Poison)* | `images/brick_jio.webp` | Poisons 1 adjacent brick (destroys it after 5s; if not hit by ball, breaks and spreads poison to another adjacent brick!). | **5s per brick** (Cascades if unhit) | ~13.4% | `audio/special_brick.mp3` & `audio/hit.mp3` |
| **Enoki Brick** *(X-Line Blast)* | `images/brick_enoki.webp` | Takes 3 hits (displays countdown badge, flashes and glows in purple neon). On 3rd hit, destroys every brick along diagonal X lines! | **3 Hits** (Countdown: 3 -> 2 -> 1) | ~11.8% | `audio/explode.mp3` & `audio/hit.mp3` |
| **Koishi Brick** *(Multiball)* | `images/brick_koishi.webp` | Launches an extra active ball into play immediately. | Instant / Ball stays until lost | ~10.6% | `audio/special_brick.mp3` |
| **Eiji Brick** *(Golden Treasure)* | `images/brick_eiji.webp` | Awards **+1000 bonus points** immediately upon destruction! | Instant | ~9.6% | `audio/special_brick.mp3` |
| **Saigo Brick** *(+ Shape Blast)* | `images/brick_saigo.webp` | Takes 3 hits (displays live countdown badge & flashes). On 3rd hit, breaks all bricks in + shape across its row and column! | **3 Hits** (Countdown: 3 -> 2 -> 1) | ~8.7% | `audio/explode.mp3` & `audio/hit.mp3` |
| **Hyakuichitaro Brick** *(Fire Ball Pierce)* | `images/brick_hyakuichitaro.webp` | Turns ball into a **Fire Ball** that pierces straight through bricks without bouncing back for **5 hits**! | **5 Hits** (Ball piercing) | ~8.0% | `audio/special_brick.mp3` & `audio/hit.mp3` |
| **Tsuruko Brick** *(Gravity Field)* | `images/brick_tsuruko.webp` | Activates a pink transparent gravity field in bottom 30% of playfield (`Y = 1120-1600`) for **8s**; balls slow down while falling. | **8 Seconds** | ~8.0% | `audio/special_brick.mp3` |
| **Ichinose Brick** *(Debuff Brick)* | `images/brick_ichinose.webp` | **DEBUFF BRICK**: Clamps **all points gained for the next 1 minute (60s) to strictly 1 point**. Displays curved red corner glow across screen. | **60 Seconds (1 Min)** | ~7.3% | `audio/special_brick_debuff.mp3` |
| **Mita Brick** *(Board Speed Boost)* | `images/brick_mita.webp` | Accelerates paddle movement speed (75% faster keyboard velocity + accelerated touch/mouse tracking) for **20 seconds**. Surrounded by vibrant golden neon electric aura. | **20 Seconds** | ~7.2% | `audio/special_brick.mp3` |
| **Manami Brick** *(Warp Jump + Cross Blast)* | `images/brick_manami.webp` | Physically leaps through the air to a random alive brick with a rotating 3D parabolic jump arc and ground shadow, detonating **5 bricks in a + sign** on landing! | Instant / 0.48s flight | ~6.8% | `audio/special_brick.mp3` & `audio/explode.mp3` |
| **Saori Brick** *(5-Rapid White Bullets)* | `images/brick_saori.webp` | Fires **5 sequential white round bullets** from the center of the player board straight up that break bricks in line! | Instant / 5-Shot Burst | ~6.5% | `audio/laser.mp3` & `audio/hit.mp3` |
| **Akuta Brick** *(Damaged Board Debuff)* | `images/brick_akuta.webp` | **DEBUFF BRICK**: Shrinks board to half-paddle (`images/bat_half.webp`, width 146px) for **1 minute (60s)**. Damaged board continuously emits billows of smoke and crackling electric sparks! | **60 Seconds (1 Min)** | ~6.0% | `audio/special_brick_debuff.mp3` |
| **Taiga Brick** *(Green Gale Updraft)* | `images/brick_taiga.webp` | Summons a powerful **Green Wind** surging up from the bottom of the screen for 1 second that bounces every ball upwards once! | Instant / 1.0s Wind Surge | ~5.8% | `audio/special_brick.mp3` & Wind Gale SFX |
| **Sui Brick** *(Container Drop Debuff)* | `images/brick_sui.webp` | **DEBUFF BRICK**: Drops a random **1–3 red shipping containers** (`images/container.webp`) sequentially from random places. If the board catches a container, it becomes **very slow for 2 seconds**! | **2 Seconds Slow** | ~5.5% | `audio/special_brick_debuff.mp3` |
| **Magata Brick** *(Danmaku Comments Debuff)* | `images/brick_magata.webp` | **DEBUFF BRICK**: Floods brick area with flying **Nico Nico Douga** style comments moving from right to left for 30s! Standout **MA☆GA☆TA** comment moves slowly in neon pink. Customizable via `magata_comments.json`. | **30 Seconds** | ~5.3% | `audio/special_brick_debuff.mp3` |
| **Ruriiro Brick** *(Illusion Swapper Debuff)* | `images/brick_ruriiro.webp` | **DEBUFF BRICK**: When broken, swaps a random brick with the **"Real" Ruriiro** brick and turns the rest into **fake Ruriiro** bricks! Fakes act like normal bricks. Destroying the Real one reverts all surviving bricks to their original state! | **Until Real Brick Destroyed / Cleared** | ~5.0% | `audio/special_brick_debuff.mp3` & `audio/special_brick.mp3` |
| **Haru Brick** *(Power Resonance)* | `images/brick_haru.webp` | Activates **Power Resonance**: slows down all balls and falling items (Zero Hearts, Containers) in **slow motion for 2 seconds**, then resets all ball speeds to normal base speed (`BASE_BALL_SPEED`)! | **2s Slow Motion + Speed Reset** | ~5.0% | `audio/special_brick.mp3` |

---

## 1. Yo Brick (`brick_yo.webp`) - *Board Extender (Timed)*

### Purpose & Concept
The **Yo Brick** is a temporary defensive power-up designed to dramatically expand the paddle intercept area for 30 seconds.

### Core Mechanics
* **Paddle Expansion**:
  * Normal Width: `215px` (`BAT_WIDTH`)
  * Extended Width: `284px` (`BAT_EXTENDED_WIDTH`)
  * Centered scaling formula keeps the paddle aligned:
    ```javascript
    const diff = (BAT_EXTENDED_WIDTH - oldWidth) / 2;
    this.bat.x = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, this.bat.x - diff));
    ```
* **Timed Duration (30 Seconds)**:
  * The board stays extended for exactly **30 seconds** of active gameplay.
  * Hitting another Yo Brick while already extended refreshes the timer back to a full 30 seconds.
  * Game pauses freeze the timer countdown.
* **Pre-Revert Warning Blink**:
  * During the **last 3 seconds** (`extendedTimer <= 3.0s`), the paddle blinks to warn the player before returning to normal size.
* **Reversion**:
  * Automatically returns to normal width (`215px`) and sprite `images/bat.webp` once the 30 seconds expire.
  * Displays floating text `BOARD NORMALIZED` and plays laser SFX.
  * Also resets immediately if all balls are lost (life lost) or on game restart.
* **Explosion Trigger**: If destroyed by an adjacent Q Brick explosion, the 30-second paddle extension still activates!

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` on hit; laser sound on normalization.
* **Floating Text**: Displays `EXTENDED BOARD! (30s)` in neon yellow (`#ffe600`).
* **Particles**: Emits 24 neon yellow particle sparks radiating outwards on destruction.
* **Falling Glowing Sakura Petals**: While the board remains extended, luminous neon pink (`#ff2a8d` / `#ff1493`), electric neon cyan/blue (`#00f0ff` / `#00bfff`), and duo-tone sakura petals with notched cherry blossom geometry continually flutter and tumble in 3D downward off the board edges with glowing halos and stardust sparkles.

---

## 2. Zero Brick (`brick_zero.webp`) - *Zero Heart (3-Bounce Extra Life)*

### Purpose & Concept
The **Zero Brick** introduces an interactive recovery minigame. Rather than granting an instant life upon impact, destroying a Zero brick drops a heavy, radiant **Zero Heart** item (`images/zero_heart.webp`, resized to the exact size of the ball: 16px radius, 32px diameter). The player must successfully bounce the Zero Heart on their paddle **3 times** before it crystallizes into an extra life!

### Core Mechanics
* **Zero Heart Drop**:
  * Upon destruction, spawns a heavy glowing Zero Heart entity (`images/zero_heart.webp`) from the center of the brick, sized to match the ball (32x32px).
  * Emits cyan & magenta particle sparks and displays floating text `BOUNCE HEART 3x!`.
* **Heavy Gravity Physics**:
  * The heart is much heavier than the standard ball, subjected to continuous downward gravitational acceleration (`HEART_GRAVITY = 0.40`).
  * Horizontal momentum reflects off left and right screen borders (`vx = -vx * 0.85`).
* **Non-Brick Interaction (Low Bounce Apex)**:
  * Upward deflection on paddle bounces is tuned (`vy = -12.5`) so its maximum parabolic peak stays in the lower zone (`~1240px`), well below the brick grid (`575px`).
  * The heart **never collides with or destroys bricks**.
* **3-Bounce Extra Life Conversion**:
  * The Zero Heart renders cleanly as-is during its drop and bounce arc (floating badge omitted).
  * **Hit 1**: Paddle bounce displays `ZERO HEART 1/3! (2 LEFT)`, playing a bounce chime and deflecting upward.
  * **Hit 2**: Paddle bounce displays `ZERO HEART 2/3! (1 LEFT)`.
  * **Hit 3**: Transmutes into a life pickup!
    * If `this.lives < 3`: Awards `+1 LIFE!`, restores a HUD life slot, plays celebratory fanfare, and erupts in cyan, magenta & gold healing particles.
    * If `this.lives >= 3`: Plays sound, triggers particles, and displays `MAX LIVES (3/3)!` without exceeding the 3-life ceiling.
* **Kazuki Shield Immunity**:
  * The heart icon **does not destroy or consume Kazuki's Neon Shield**. If the player fails to catch the heart, it drops cleanly through `SHIELD_Y = 1530` and falls off-screen (`HEART LOST`), leaving the shield 100% active and intact.
* **Gravity Field Immunity**:
  * The heart is **unaffected by Tsuruko's Pink Gravity Field**, maintaining its authentic heavy gravitational drop rate without artificial slow-motion drag.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` on drop and on final 3rd bounce; `audio/bounce.mp3` on paddle deflections.
* **Floating Text**: `BOUNCE HEART 3x!` on spawn, `ZERO HEART N/3!` on paddle bounce, and `+1 LIFE!` on 3rd bounce.
* **Visuals**: Rendered cleanly with `images/zero_heart.webp` as is (sized to 32x32px ball dimensions), without artificial glow or floating `1/3` badge, accompanied by paddle hit sparks.

---

## 3. Tsuki Brick (`brick_tsuki.webp`) - *Magnetism (Single Ball & Single Brick)*

### Purpose & Concept
The **Tsuki Brick** activates an electromagnetic tractor-beam. It magnetizes the **single closest brick to the player board**, causing the ball that broke the Tsuki brick to lock onto and fly straight towards that magnetized brick.

### Core Mechanics
* **Single-Ball Magnetism**:
  * Magnetism strictly affects **only the specific ball that broke the Tsuki brick** (`sourceBall.hasMagnetEffect = true`).
  * In multiball, other balls continue moving with normal physics and do not home in.
  * The magnetized ball is highlighted with a pulsing neon cyan orbit halo and an animated tractor tether.
* **Single-Brick Target**:
  * The magnet is placed on the single closest alive brick to the player's paddle center (`magnetBricksRemaining = 1`).
  * If another Tsuki Brick is destroyed while magnetism is active, it resets to 1 and rebinds to the breaking ball.
* **Premature Cancellation on Non-Magnet Brick Hit**:
  * **Critical Rule**: If the magnetized ball breaks another brick that is **not** the brick with the magnet, the magnet effect is immediately removed (`MAGNET REMOVED`).
  * If the magnetized ball hits and breaks the magnetized brick, the magnet effect is consumed normally (`MAGNET ENDED`).
  * If the magnetized ball falls into the bottom pit, the effect is removed.
* **Light Blue Neon Aura & Tether**:
  * The active magnet brick glows with a pulsing electric light-blue neon border (`#00f3ff`).
  * An animated light-blue magnetic tether line tracks exclusively from the magnetized ball to the magnetized brick.
* **Explosion Trigger**: If destroyed by an adjacent Q Brick explosion, magnetism activates for the closest remaining brick and binds to the active ball.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3`.
* **Floating Text**: Displays `MAGNET ACTIVE (1 BALL)!` on activation, `MAGNET REMOVED` if another brick is broken, and `MAGNET ENDED` once the magnetized brick is broken.
* **Particles**: 30 bright light-blue neon electric particles on activation.

---

## 4. Q Brick (`brick_q.webp`) - *Adjacent Brick Explosion*

### Purpose & Concept
The **Q Brick** is a high-yield explosive cluster brick. Hitting it triggers a shockwave that obliterates all adjacent alive bricks in the grid.

### Core Mechanics
* **Grid Adjacency Blast**:
  * Detects all neighboring alive bricks in the grid (`Math.abs(b.col - brick.col) <= 1 && Math.abs(b.row - brick.row) <= 1`).
  * Destroys neighboring bricks simultaneously, awarding points for each and triggering explosive reactions.
* **Special Brick Skill Activation in Blast Zone**:
  * Any special brick caught in the blast triggers its unique power-up (e.g. adjacent Yo expands paddle, adjacent Zero spawns ball, adjacent Kazuki adds shield, adjacent Q triggers chain-reaction explosion!).
* **Screen Shake**:
  * Applies an intense physical screen shake to the game canvas container for immediate kinetic punch.

### Sensory Feedback
* **Audio**: Plays `audio/explode.mp3`.
* **Floating Text**: Displays `BOOM!` in bold neon crimson (`#ff3b30`).
* **Particles**: Dual-tier explosion emitting 36 fiery red and 20 hot orange particles.

---

## 5. Kazuki Brick (`brick_kazuki.webp`) - *Neon Safety Shield*

### Purpose & Concept
The **Kazuki Brick** summons an emergency neon safety barrier beneath the player's board, preventing balls from falling down into the death zone and instead bouncing them safely back up into the playfield.

### Core Mechanics
* **Animated Digital Jagged Neon Light Blue Line**:
  * Deployed across the full screen width at `Y = 1530` (comfortably below the player's paddle at `Y = 1440`).
  * Features a dynamic digital pulse waveform with raised and lowered rectangular blocks scrolling smoothly to the right and looping seamlessly.
  * Rendered with semi-transparent cyan filled pulse blocks, a multi-layered laser outline with an intense `#00f3ff` light-blue neon glow, and white-hot laser core.
  * Includes a subtle straight baseline beam for clear spatial reference.
* **Active Duration (15 Seconds) & 1-Hit Expiration**:
  * Stays active for **15 seconds** of live gameplay (`SHIELD_DURATION = 15`), or until struck by a ball.
  * **1-Hit Rule**: Upon deflecting a ball, the shield absorbs the impact, redirects the ball safely upward, and immediately disappears.
  * If another Kazuki brick is broken while active, the timer refreshes to 15 seconds.
  * During the last 3 seconds of its timer, the shield flashes as a visual expiration warning.
* **Ball Deflection**:
  * Any ball descending past the paddle hits the shield line, bounces back upwards (`ball.vy = -Math.abs(ball.vy)`), triggers neon cyan impact sparks, and consumes the shield.
* **Explosion Trigger**: If destroyed by an adjacent Q Brick explosion, the neon shield deploys immediately!

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` on activation; `audio/bounce.mp3` on deflection.
* **Floating Text**: None (only points text appears in the field).
* **Particles**: 30 electric cyan particles on activation, plus vibrant cyan & white explosion sparks along the shield line on ball bounce.

---

## 6. Miu Brick (`brick_miu.webp`) - *Dual Turrets (30 Seconds)*

### Purpose & Concept
The **Miu Brick** mounts high-tech cyber turrets on the left and right flanks of the player's board. Whenever a ball bounces off the board, both turrets simultaneously fire upward-traveling neon plasma laser bolts that obliterate bricks on impact.

### Core Mechanics
* **30-Second Active Duration**:
  * Upon destruction of a Miu brick, dual turrets activate for **30 seconds** (`TURRET_DURATION = 30`).
  * If another Miu brick is destroyed while turrets are already active, the timer refreshes back to a full 30 seconds.
  * During the last 3 seconds (`turrets.timer <= 3.0s`), the turrets blink to signal impending expiration.
* **Board-Bounce Triggered Laser Salvo**:
  * Every time a ball collides with and bounces off the player's board (paddle), the left and right turrets immediately fire two plasma bolts straight upward:
    ```javascript
    fireTurrets() {
      if (!this.turrets.active) return;
      const leftX = this.bat.x - 7;
      const rightX = this.bat.x + this.bat.width + 7;
      const spawnY = this.bat.y - 20;

      this.bullets.push({ x: leftX, y: spawnY, vy: -BULLET_SPEED });
      this.bullets.push({ x: rightX, y: spawnY, vy: -BULLET_SPEED });

      this.sound.playLaser();
      this.spawnExplosion(leftX, spawnY, '#ff2a85', 6);
      this.spawnExplosion(rightX, spawnY, '#ff2a85', 6);
    }
    ```
* **Bullet Impact & Chain Reactions**:
  * Bullets travel upward at `BULLET_SPEED = 20`.
  * When a bullet strikes any alive brick, the brick is destroyed, awarding points (`+10`).
  * If a struck brick is another **Special Brick**, its skill is triggered immediately via `onSpecialBrickDestroyed`!
* **Explosion Trigger**: If destroyed by an adjacent Q Brick explosion, the dual turrets deploy immediately!

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` on activation; `audio/laser.mp3` on each turret blast.
* **Floating Text**: Displays `DUAL TURRETS (30s)!` in neon magenta (`#ff2a85`).
* **Visuals**: Animated cyber wings with cyan gun barrels mounted directly to the paddle wings, firing small straight vertical lasers with a brilliant magenta pink glow (`#ff007f` / `#ff3399`) and hot white-pink laser cores.

---

## 7. Jio Brick (`brick_jio.webp`) - *Toxic Poison Chain*

### Purpose & Concept
The **Jio Brick** unleashes an infectious toxic bio-agent across the grid. When destroyed, it infects an adjacent brick with poison. A countdown begins: if the player fails to break the poisoned brick with a ball within 5 seconds, it breaks on its own and infects another adjacent brick!

### Core Mechanics
* **Initial Poison Infection**:
  * Breaking a Jio brick strictly targets an alive, unpoisoned adjacent brick neighboring it and poisons it (`brick.isPoisoned = true`, `poisonTimer = 5.0`).
  * **Strict Proximity Rule**: If there are no adjacent alive bricks around it, the poison effect does not run at all.
* **5-Second Countdown**:
  * Poisoned bricks display a pulsating neon toxic green aura (`#39ff14`), an overlay wash, an animated countdown bar, and digital timer text `☣ Xs`.
  * Toxic green spore particles periodically bubble up from the poisoned brick.
* **Ball Hit (Cured/Defused)**:
  * If the ball (or player turret laser) strikes the poisoned brick before the 5-second timer runs out, the brick breaks immediately and the poison chain ends!
* **Auto-Break & Cascade Spread**:
  * If 5 seconds elapse **without being destroyed by a ball**, the poisoned brick breaks on its own, awarding full points (`+10`).
  * If it was a special brick, its special effect activates!
  * It then automatically spreads poison to another adjacent alive unpoisoned brick, resetting a fresh 5-second timer on the new target!
  * The cascade continues automatically until all adjacent options are exhausted or the player interrupts the chain with a ball hit.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` on activation; `audio/hit.mp3` on poison break.
* **Floating Text**: Displays `POISON SPREAD!` on Jio break, `POISONED (5s)!` on infected brick, and `POISON BREAK! +10` on auto-detonation.
* **Visuals**: Neon lime green pulsating aura (`#39ff14`), live countdown progress bar, timer indicator, and bubbling toxic spore particles.

---

## 8. Enoki Brick (`brick_enoki.webp`) - *3-Hit Countdown & Diagonal X-Line Detonation*

### Purpose & Concept
The **Enoki Brick** is a fortified tactical cluster bomb brick with glowing purple neon cyber aesthetics. Unlike standard bricks that break in a single impact, Enoki requires **3 hits** to detonate. Every hit decrements a live on-brick countdown badge with vibrant purple neon flash effects. Upon the 3rd hit, it unleashes an **X-Line Detonation**, destroying all alive bricks along the intersecting diagonal axes across the entire grid!

### Core Mechanics
* **3-Hit Durability**:
  * Initial health: `hitsRemaining = 3`.
  * Hit 1: Decrements to `2`, flashes with a high-intensity purple wash (`#f075ff`), emits purple neon sparks, and pops floating text `2 HITS LEFT!`.
  * Hit 2: Decrements to `1`, flashes again, emits sparks, and pops floating text `1 HIT LEFT!`.
  * Hit 3: Destroys the brick (`alive = false`), awards points (`+10`), and triggers the massive **X-Line Detonation**!
* **Diagonal X-Line Detonation**:
  * Calculates every alive brick on the diagonal lines intersecting at the Enoki brick:
    ```javascript
    const xLineBricks = this.bricks.filter(
      b => b.alive && b !== brick && Math.abs(b.col - brick.col) === Math.abs(b.row - brick.row)
    );
    ```
  * Every brick along both diagonals (\ and /) across the full board is immediately obliterated!
* **Special Brick Skill Activation in X-Blast**:
  * Any special bricks caught in the diagonal blast trigger their special power-ups immediately (cascading Enoki X-blasts, Q bomb explosions, shields, turrets, poison chains, etc.)!
* **Visual Laser Beams**:
  * Renders brilliant multi-tiered purple neon laser beams (`#bf00ff`, `#e066ff`, white core) slicing diagonally through the playfield.

### Sensory Feedback
* **Audio**: Plays `audio/hit.mp3` on hits 1 & 2; plays `audio/explode.mp3` on the 3rd detonation hit.
* **Floating Text**: Displays `2 HITS LEFT!`, `1 HIT LEFT!` on impacts, and `X-BLAST!` in bold neon purple (`#bf00ff`) on detonation.
* **Visuals**: Constant pulsing purple neon glow border (`#bf00ff`), top-right on-brick live countdown badge (`3`, `2`, `1`), purple neon impact flashes (`#f075ff`), and sweeping diagonal laser beams.

---

## 9. Koishi Brick (`brick_koishi.webp`) - *Debuff Cleanser*

### Purpose & Concept
The **Koishi Brick** is a purifying support brick. Upon destruction, it detects and **clears any running debuff** currently hindering the player. If no debuff is active, it does nothing special upon breaking.

### Core Mechanics
* **Comprehensive Debuff Cleansing**:
  * Detects all active game debuffs:
    * **Ichinose 1-Point Debuff**: Instantly cancels the debuff and restores full score scoring (`this.pointDebuff.active = false`).
    * **Akuta Shortened Paddle**: Instantly restores the paddle from `bat_half` (146px) back to full size (218px) (`this.resetBatSize()`).
    * **Sui Heavy Slow Debuff**: Instantly cancels paddle sluggishness and restores full board mobility (`this.boardSlowDebuff.active = false`).
    * **Sui Container Rain & Falling Containers**: Instantly ends the 30-second continuous drop cycle and disintegrates any falling containers on screen (`this.suiContainerRain.active = false`, explodes all active containers into green sparks).
    * **Jio Toxic Poison**: Cleanses all currently poisoned bricks in the grid (`b.isPoisoned = false; b.poisonTimer = 0;`).
* **Conditional Activation ("Don't do anything if there is no debuff")**:
  * If **no debuff is currently running**, the Koishi brick simply breaks with standard hit sound and lime hit sparks without triggering any special cleanse sequence or notification.
* **On-Brick Display**:
  * Displays cleanly as is with its original sprite asset (`images/brick_koishi.webp`), with no borders or overlays.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` when debuffs are cleansed; standard `audio/hit.mp3` if no debuff was active.
* **Floating Text**: Displays `DEBUFF CLEARED!` in radiant emerald lime (`#88d629`) when debuffs are cleansed.
* **Particles**: Cleansing emerald, lime, and white starburst explosion (`#88d629`, `#00ff88`, `#ffffff`) at the brick and a purifying spark halo around the paddle board.

---

## 10. Eiji Brick (`brick_eiji.webp`) - *Golden Treasure (+1000 Points)*

### Purpose & Concept
The **Eiji Brick** is a high-value treasure brick adorned in glittering cyber-gold. Destroying an Eiji brick immediately awards a massive jackpot bonus of **+1000 points** to accelerate the player's score and trigger new high score records.

### Core Mechanics
* **Instant +1000 Point Jackpot**:
  * Upon destruction, immediately adds `+1000` points (`this.addScore(1000)`).
  * Plays rewarding chime `this.sound.playSpecialHit()`.
  * Displays floating text `+1000 PTS!` in bold radiant neon gold (`#ffe600`).
* **Explosion Trigger**:
  * If destroyed by a Q bomb blast, Jio poison cascade, or Enoki diagonal X-blast, the +1000 bonus points are awarded immediately!

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3`.
* **Floating Text**: Displays `+1000 PTS!` in brilliant neon gold (`#ffe600`).
* **Particles**: Radiant golden treasure burst emitting gold (`#ffe600`), amber (`#ffb700`), and white-hot spark particles (`#ffffff`).
* **Visuals**: Pulsing radiant golden neon aura (`#ffe600`) and golden border.

---

## 11. Saigo Brick (`brick_saigo.webp`) - *3-Hit Countdown & + Shape Cross Blast*

### Purpose & Concept
The **Saigo Brick** is a fortified cybernetic heavy artillery brick with mechanized goggles and fiery crimson neon aesthetics. Like the Enoki brick, Saigo possesses fortified armor that requires **3 hits** to break. Every hit decrements a live on-brick countdown badge with fiery crimson flash effects. Upon the 3rd hit, it detonates a **+ Shape Blast**, breaking all alive bricks in the same row and column across the board!

### Core Mechanics
* **3-Hit Durability**:
  * Initial health: `hitsRemaining = 3`.
  * Hit 1: Decrements to `2`, flashes with a high-intensity crimson wash (`#ff7755`), emits sparks, and pops floating text `2 HITS LEFT!`.
  * Hit 2: Decrements to `1`, flashes again, emits sparks, and pops floating text `1 HIT LEFT!`.
  * Hit 3: Destroys the brick (`alive = false`), awards points (`+10`), and triggers the massive **+ Shape Cross Blast**!
* **+ Shape (Row & Column) Blast**:
  * Targets all alive bricks in the same column OR the same row as the Saigo brick:
    ```javascript
    const plusLineBricks = this.bricks.filter(
      b => b.alive && b !== brick && (b.col === brick.col || b.row === brick.row)
    );
    ```
  * Obliterates the entire horizontal row and vertical column simultaneously!
* **Special Brick Skill Activation in Blast Zone**:
  * Any special bricks caught in the + blast trigger their special power-ups immediately (cascading blasts, bombs, multiballs, shields, poison, etc.)!
* **Visual Laser Beams**:
  * Renders brilliant fiery red/orange laser beams (`#ff3300`, `#ffa500`, white core) slicing across the entire width and height of the playfield.

### Sensory Feedback
* **Audio**: Plays `audio/hit.mp3` on hits 1 & 2; plays `audio/explode.mp3` on the 3rd detonation hit.
* **Floating Text**: Displays `2 HITS LEFT!`, `1 HIT LEFT!` on impacts, and `+ BLAST!` in bold neon crimson (`#ff3300`) on detonation.
* **Visuals**: Pulsing fiery crimson neon glow border (`#ff3300`), top-right on-brick live countdown badge (`3`, `2`, `1`), crimson impact flashes (`#ff7755`), and horizontal + vertical laser beams.

---

## 12. Hyakuichitaro Brick (`brick_hyakuichitaro.webp`) - *Fire Ball Pierce (5 Hits)*

### Purpose & Concept
The **Hyakuichitaro Brick** is an intense offensive power-up featuring vivid purple hair, glowing pink eyes, and fierce determination. Breaking this brick transforms the ball into a blazing **Fire Ball** that shears through defenses without bouncing back for the next **5 bricks** it contacts!

### Core Mechanics
* **Fire Ball Empowerment**:
  * Only turns the ball that directly destroyed the brick into a **Fire Ball** (`ball.isFireBall = true` and `ball.fireHitsRemaining = 5`).
  * If the brick is broken by another method (such as another brick's effect, secondary explosions, turret bullets, lasers, or poison), no ball is turned into a Fire Ball.
* **Non-Bouncing Piercing Impact**:
  * When hitting a brick while `isFireBall` is active, the ball **does not reflect its velocity** (`ball.vx` and `ball.vy` continue unhindered).
  * Consumes 1 hit: `ball.fireHitsRemaining--`.
  * The struck brick is shattered on impact, points are awarded (+10), and special brick skills trigger normally.
  * Once 5 bricks are pierced (`fireHitsRemaining === 0`), `isFireBall` turns `false` and the ball resumes normal reflective physics.
* **Fire Comet Visuals**:
  * The ball's comet tail shifts from electric cyan to blazing incandescent orange and white-hot flame cores.
  * An animated dual-layer solar corona rotates around the ball accompanied by a floating `🔥x[hits]` indicator.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` upon brick destruction and `audio/hit.mp3` with fiery impact sparks per brick pierced.
* **Floating Text**: Displays `FIRE BALL! (x5)` on activation, and `PIERCE! (N LEFT)` on each brick sliced through.
* **Particles**: Heavy eruption of crimson (`#ff3b30`), flame orange (`#ffa500`), and golden sparks (`#ffcc00`).
* **Visuals**: Pulsing flame orange border (`#ff5500`) and glowing fiery aura.

---

## 13. Tsuruko Brick (`brick_tsuruko.webp`) - *Pink Gravity Field (8s)*

### Purpose & Concept
The **Tsuruko Brick** is a strategic spatial manipulation power-up featuring charming pink hair and radiant pink eyes with a chic black beret. Breaking a Tsuruko brick generates a translucent **Pink Gravity Field** across the bottom 30% of the playfield (`Y = 1120 to 1600`, 480px height) for **8 seconds**, applying anti-gravity drag that significantly slows down balls while falling!

### Core Mechanics
* **Gravity Field Activation**:
  * Upon destruction, sets `this.gravityField.active = true` and `this.gravityField.timer = 8.0`.
  * If another Tsuruko brick is broken while active, the timer refreshes back to 8 seconds.
* **Fall-Damping Time Dilation**:
  * Specifically targets balls in the bottom 30% of the playfield while falling (`ball.y >= 1120 && ball.vy > 0`).
  * Motion displacement is damped by a factor of `0.45` (55% speed reduction), providing generous reaction time to position the paddle.
  * When a ball bounces off the paddle or walls and moves upward (`ball.vy < 0`), it moves at normal 100% velocity to preserve fast block-clearing momentum.
* **Translucent Cyber-Pink Visuals**:
  * Renders a glowing translucent pink gradient filling the bottom 30% of the screen (`Y = 1120 to 1600`).
  * Marked by a pulsating neon pink boundary beam at `Y = 1120` with subtle upward-drifting wave grid lines.
  * A live countdown timer (`GRAVITY FIELD: [N]s`) displays in neon pink within the field.
  * Balls falling through the zone exhibit a pulsating dotted pink anti-gravity aura and sparkles.
  * **On-Brick Display**: Outlined with a glowing neon pink border (`#ff69b4`). As per game design rules, Tsuruko has **no on-brick badge** (only Enoki and Saigo have countdown badges).

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` upon activation.
* **Floating Text**: Displays `GRAVITY FIELD (8s)!` in vivid neon pink (`#ff69b4`).
* **Particles**: Triple-tiered pink and white energy burst (`#ff69b4`, `#ff1493`, `#ffffff`).
* **Visuals**: Translucent pink field gradient, top neon boundary line, upward drifting anti-gravity lines, and ball slow-motion pulse rings.

---

## 14. Ichinose Brick (`brick_ichinose.webp`) - *Debuff Brick (1-Point Penalty & Red Corner Glow)*

### Purpose & Concept
The **Ichinose Brick** introduces a new archetype: **Debuff Bricks**. Unlike beneficial power-ups, breaking a debuff brick inflicts a severe handicap upon the player, drastically reducing scoring potential for a sustained period while draping the arena in an ominous red vignette.

### Core Mechanics
* **1-Point Penalty (`DEBUFF_ICHINOSE_DURATION = 60s`)**:
  * Upon destruction, sets `this.pointDebuff.active = true` and `this.pointDebuff.timer = 60.0` (1 full minute).
  * Every score gain throughout the game—standard brick destructions (normally +10), Eiji jackpots (normally +1000), wave clear bonuses (normally +500), explosion kills, laser kills, and poison breaks—is strictly clamped to **`1` point**:
    ```javascript
    addScore(points) {
      const isDebuffed = this.pointDebuff && this.pointDebuff.active;
      const finalPoints = isDebuffed ? 1 : points;
      this.score += finalPoints;
      ...
      return finalPoints;
    }
    ```
  * All floating score indicators render in warning crimson red (`#ff3344`) displaying `+1` while the debuff is active.
* **Field Watermark ("NUMBERS 1 NANODA")**:
  * Centered directly on the open playfield between the brick formation and the paddle, a large transparent white watermark displays:
    ```
    NUMBERS
       1
    NANODA
    ```
    with the **`1` rendered in an enormous 240px bold font**, displayed as pure, transparent white text with no outline throughout the debuff duration.
* **Curved Red Corner Screen Glow (Vignette)**:
  * When the debuff is active, a red glow renders around the corners and edges of the screen:
    * **4 Corner Radial Gradients**: Located at top-left `(0, 0)`, top-right `(CANVAS_WIDTH, 0)`, bottom-left `(0, CANVAS_HEIGHT)`, and bottom-right `(CANVAS_WIDTH, CANVAS_HEIGHT)` with radius `420px`, fading smoothly toward the center.
    * **Perimeter Edge Vignette**: An ambient radial gradient framing the entire viewport in subtle crimson pulse.
    * **Live Timer Warning**: Centered directly below the header divider line: `⚠️ DEBUFF: 1 PT ONLY! (${secLeft}s)` in glowing red pixel font.
    * **Pre-Expiry Flash**: In the final 3 seconds (`timer <= 3.0s`), the vignette strobes to notify the player that normal scoring is about to resume.
* **On-Brick Display & Badge Rules**:
  * Outlined with an ominous cursed crimson neon glow (`#ff0033`).
  * **Strictly NO on-brick badge**: In strict compliance with the badge rule (*only Enoki and Saigo have countdown badges*), Ichinose displays no badge icon.
* **Expiration / Reversion**:
  * After 60 seconds of active play, the debuff expires, clearing the red screen glow, field watermark, and popping floating text `DEBUFF CLEARED` in radiant mint green (`#00ff88`).
  * Debuff state also clears if all balls are lost (life lost) or on game restart.

### Sensory Feedback
* **Audio**: Plays specialized debuff audio `audio/special_brick_debuff.mp3` upon activation.
* **Field Watermark**: Transparent white `NUMBERS 1 NANODA` text (no outline) with giant `1` in the center field.
* **Particles**: Tri-level dark crimson, burgundy, and abyss particle burst (`#ff0033`, `#880015`, `#220005`).
* **Visuals**: Curved 4-corner radial red screen glow, edge perimeter vignette, live header timer, red `+1` score numbers, and transparent white field text.

---

## 15. Mita Brick (`brick_mita.webp`) - *Board Speed Boost (Timed)*

### Purpose & Concept
The **Mita Brick** is an agile defensive and positioning power-up. Upon destruction, it supercharges the player's board / paddle, fastening its movement speed and agility for **20 seconds** to effortlessly track fast-moving balls and multi-ball clusters.

### Core Mechanics
* **Paddle Acceleration (`BOARD_SPEED_BOOST_DURATION = 20s`)**:
  * Upon destruction, sets `this.boardSpeedBoost.active = true` and sets `this.boardSpeedBoost.timer = 20.0` (20 seconds).
  * **Keyboard Speed**: Increases `keySpeed` from `16` to `28` per frame (a 75% speed increase).
  * **Interpolation / Touch Tracking**: Accelerates paddle lerp factor from `0.35` to `0.65`, allowing the paddle to instantaneously snap to mouse cursor and finger touch positions with extreme precision.
  * If another Mita brick is destroyed while speed boost is already active, the timer refreshes back to full 20 seconds.
* **Electric Spark & Lightning Effect**:
  * Active crackling lightning bolts crawl dynamically along the board's surface.
  * High-velocity electric spark particles shoot off the perimeter of the paddle into the playfield.
  * In the final 3 seconds (`timer <= 3.0s`), the electric arcs strobe to signal that normal speed is about to resume.
* **Reversion / Expiration**:
  * After 20 seconds, paddle movement speeds return to default, popping floating notification `SPEED NORMALIZED` in radiant yellow (`#ffea00`).
  * State also clears if all balls are lost (life lost) or on game restart.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3`.
* **Floating Text**: Displays `SPEED BOOST (20s)!` in bright yellow (`#ffea00`).
* **Particles**: Emits 28 golden and amber particle sparks radiating outwards (`#ffea00`, `#ff9100`, `#ffffff`) on break, plus continuous crackling sparks while boosted.
* **Visuals**: Crawling electric lightning arcs across the paddle and flying spark particles. Clean board presentation with no distracting background glow or boxy outlines.

---

## 16. Manami Brick (`brick_manami.webp`) - *Warp Jump + Cross Blast*

### Purpose & Concept
The **Manami Brick** is an offensive jumping explosive power-up. Upon destruction, the brick itself physically leaps across the board along a high parabolic arc to a random alive brick and detonates **5 bricks in a + sign** centered around that chosen brick on impact!

### Core Mechanics
* **Random Target Selection**:
  * Upon destruction, identifies all remaining alive bricks on the board.
  * Randomly selects one alive brick as the jump destination.
* **Physical Jumping Brick Animation (No Laser Beam)**:
  * Launches the actual `brick_manami` sprite soaring through the air for **0.48 seconds**.
  * Follows a smooth parabolic trajectory with elevated vertical jump arc (`peakHeight = 110px`).
  * Features a dynamic ground shadow directly beneath the flying brick that contracts at peak altitude and expands on approach.
  * Performs a continuous 360° spin with slight apex scale pop in mid-air.
  * Leaves a glowing orchid and white particle smoke trail in its flight path.
* **5-Brick + Sign Cross Blast on Impact**:
  * The moment the jumping brick lands on the target brick, it triggers an explosion and screen shake.
  * Targets the center chosen brick plus all 4 orthogonally adjacent neighbors:
    - Center brick: `(col, row)`
    - Up: `(col, row - 1)`
    - Down: `(col, row + 1)`
    - Left: `(col - 1, row)`
    - Right: `(col + 1, row)`
  * Destroys all 5 bricks in this `+` pattern simultaneously, awarding full points for each.
  * If any brick in the cross blast is a special brick, its special skill immediately chains and triggers!
* **On-Brick Display & Grid Glow**:
  * Outlined with an electric orchid / vibrant fuchsia neon glow border (`#f368e0`).

### Sensory Feedback
* **Audio**: Plays launch chimes (`audio/special_brick.mp3`) on leap; `audio/explode.mp3` on the landing cross blast detonation.
* **Floating Text**: Displays `JUMP!` at launch and `+ CROSS BLAST!` at destination on landing in vibrant orchid (`#f368e0`).
* **Particles**: Launch burst at origin, in-flight trail particles, and explosive fuchsia, magenta, and white detonation burst on impact.
* **Visuals**: Animated spinning brick sprite soaring through the air with ground shadow, followed by cross blast explosions. Strictly no laser beams.

---

## 17. Saori Brick (`brick_saori.webp`) - *5-Rapid White Bullets*

### Purpose & Concept
The **Saori Brick** is a high-firepower offensive barrage power-up. Upon destruction, it immediately initiates a rapid-fire sequence of **5 white round bullets** shot upward from the center of the player's board, drilling straight through bricks in vertical line.

### Core Mechanics
* **Sequential Center-Board Barrage**:
  * Upon destruction, queues a 5-shot volley (`this.saoriVolleys`).
  * Fires **5 sequential white round bullets** spaced at **0.12-second intervals** (~0.48s total volley duration).
  * Each bullet spawns dynamically at the **current center of the player board** (`(bat.x + bat.width / 2, bat.y - 12)`). If the player moves the paddle during the burst, bullets track the paddle's movement, allowing players to either concentrate fire into a single column or sweep across multiple columns!
* **White Round Bullet Physics & Destruction**:
  * Speed: `20px` per frame (`1200px/s` upward velocity).
  * Radius: `9px` circular glowing orb with white-hot core and soft silver/cyan halo.
  * Travels vertically in line until colliding with an alive brick or reaching the header line.
  * Breaks the first alive brick in its trajectory, awarding score, cascading special effects if applicable, and despawns with a splash of white sparks.
* **On-Brick Display & Grid Glow**:
  * Soft radiant white ambient halo wash (`#ffffff`).

### Sensory Feedback
* **Audio**: Plays crisp laser sound (`audio/laser.mp3`) on each bullet discharge, and `audio/hit.mp3` on brick impact.
* **Floating Text**: Displays `RAPID BULLETS (x5)!` in pure white (`#ffffff`).
* **Particles**: White spark trail behind bullets, splash burst upon hitting bricks, and silver/white explosion on brick destruction.
* **Visuals**: Distinctive glowing white circular plasma orbs soaring upward in rapid succession.

---

## 18. Akuta Brick (`brick_akuta.webp`) - *Debuff Brick: Damaged Board (1 Minute)*

### Purpose & Concept
The **Akuta Brick** is a hazardous debuff brick. Destroying it damages the player's board, immediately shrinking its width in half into the broken paddle sprite (`images/bat_half.webp`) for **1 full minute (60 seconds)**, requiring precision control while smoke and erratic electric sparks plume from the broken board.

### Core Mechanics
* **Board Shortening (Half-Paddle)**:
  * Normal Paddle Width: `215px` (`BAT_WIDTH`, sprite `images/bat.webp`)
  * Half Paddle Width: `146px` (`BAT_HALF_WIDTH`, sprite `images/bat_half.webp`)
  * When Akuta is destroyed, `shortenBat()` shrinks the paddle to 146px, preserves paddle center position, and activates `bat.isShortened = true` with a **60-second countdown timer** (`shortenedTimer = 60.0s`).
  * If the paddle is currently extended by Yo Brick, the extension is cancelled and overridden by the damage.
  * If Akuta is destroyed again while already damaged, the 60-second timer resets back to 60s.
  * When the timer expires, the board smoothly restores back to standard size (`215px`).
* **Warning HUD Indicator & Pre-Revert Blink**:
  * Top HUD displays flashing warning: `⚡ BOARD DAMAGED! (XXs)`.
  * During the last 3 seconds of the debuff (`shortenedTimer <= 3.0s`), the shortened paddle blinks rapidly before snapping back to full size.
* **Smoke Puffs & Electric Spark Broken Effect**:
  * While damaged, the board continually vents billows of rising smoke particles (`type: 'smoke'`) that drift upward and expand with realistic drag, rotation, and alpha fade.
  * Emits high-energy short-circuit electric spark bursts (`type: 'spark'`) in bright cyan and electric yellow, rendered as sharp jagged arcs crackling across the damaged edges.
* **On-Brick Display & Grid Glow**:
  * Cursed dark crimson hazard glow (`#ff2244`) with pulsing aura distinguishing it as a dangerous debuff brick alongside Ichinose.

### Sensory Feedback
* **Audio**: Plays the ominous debuff chord (`audio/special_brick_debuff.mp3`) upon breakage.
* **Floating Text**: Displays `BOARD SHORTENED (1M)!` in intense crimson (`#ff2244`).
* **Screen Shake**: Triggers a 0.25-second screen tremor on detonation.
* **Screen Visuals**: Displays the same pulsating red corner glow vignette as Ichinose brick across all 4 screen corners and perimeter throughout the 60-second debuff (blinks during final 3s).
* **Particles**: Crimson debris explosion, followed by continuous rising smoke plumes and crackling electric spark arcs on the damaged paddle throughout the 1-minute duration.

---

## 19. Taiga Brick (`brick_taiga.webp`) - *Green Gale Updraft*

### Purpose & Concept
The **Taiga Brick** is a high-utility rescue and repositioning power-up. Upon destruction, it unleashes a surging updraft of **Green Wind** rushing from the bottom of the screen that pushes all active balls straight back up into the brick area instead of falling down into the void.

### Core Mechanics
* **1-Second Green Wind Gale & Bounce Every Ball Upwards Once (`this.taigaWind`)**:
  * Upon destruction, unleashes a **1-second** surging gale of **Green Wind** rising from the bottom across the screen (`timer: 1.0s`, `duration: 1.0s`).
  * **Bounces Every Ball Upwards Once**:
    * All active balls in play are instantly propelled upwards toward the brick field (`vy < 0`, maintaining exact current ball speed with no speed increase, and given emerald slipstream rings).
    * Any ball reaching or falling toward the paddle area during the 1-second gale is also caught and bounced upwards once.
    * Each ball is strictly bounced **once** per Taiga wind event (`ball.bouncedByWind = true`), ensuring no multiple or infinite bouncing.
  * **Strict 1-Second Lifetime**: After exactly 1.0 second, `this.taigaWind.active = false` and the wind completely ceases, with balls continuing their natural physics trajectory.
* **On-Brick Display**:
  * Displays cleanly as is with its original sprite asset (`images/brick_taiga.webp`), with no distracting border overlays.

### Sensory Feedback
* **Audio**: Plays synthesized rushing wind gale SFX (`playWindGale()`) alongside `audio/special_brick.mp3`.
* **Floating Text**: None (only points text appears in the field).
* **Particles**: Emerald, mint, and white particle explosion at the brick; vertical flowing wind streamer ribbons and spiraling wind particles rushing upward from the bottom during the 1 second.

---

## 20. Sui Brick (`brick_sui.webp`) - *Container Drop Debuff*

### Purpose & Concept
The **Sui Brick** is a continuous hazardous debuff obstacle. Upon destruction, it activates a 30-second hazard cycle where **one shipping container falls every few seconds for about 30 seconds**. In addition, containers **spin around dynamically in mid-air** instead of falling flat. If the player board catches a falling container, the paddle is weighed down and becomes **extremely slow for 2 seconds**.

### Core Mechanics
* **Continuous Container Rain for 30 Seconds**:
  * Upon destruction, activates `this.suiContainerRain` lasting **30.0 seconds**.
  * Drops **one container every few seconds** (staggered intervals of ~3.0s–4.5s) from randomized horizontal positions across the header line.
  * When the 30-second duration expires, a notification `CONTAINER RAIN ENDED` appears.
* **Dynamic Mid-Air Spinning**:
  * Each container spins rapidly around its center (`rotationSpeed = ±(3.0 to 5.5) rad/s`) instead of falling flat.
  * Rendered with live canvas rotation (`ctx.rotate(c.rotation)`) and red hazard neon illumination.
  * Radial collision detection (`collisionRadius = 38px`) guarantees accurate paddle interception while spinning at any angle.
* **Board Slow Debuff (Catching a Container)**:
  * If the player paddle catches any spinning container, the board enters a **Heavy Slow** debuff for **2 seconds** (`this.boardSlowDebuff = { active: true, timer: 2.0 }`).
  * Both keyboard velocity and mouse/touch interpolation are clamped to a crawling pace (~4.5px/frame) so the sluggishness cannot be bypassed.
  * The board radiates an intense pulsing **red neon glow aura behind the paddle** without distracting square outlines or overlays.
  * If the container misses the paddle and exits the bottom of the screen, the player successfully evades the debuff!
* **On-Brick Display**:
  * Displays cleanly as is with its original sprite asset (`images/brick_sui.webp`), with no distracting border overlays.

### Sensory Feedback
* **Audio**: Plays debuff warning SFX (`audio/special_brick_debuff.mp3`) on break and on container catch.
* **Floating Text**: Displays `CONTAINER RAIN (30S)!` on break, `HEAVY SLOW (2s)!` on catch, and `CONTAINER RAIN ENDED` upon completion.
* **Screen Visuals**: Full **red corner glow vignette** pulses around all 4 corners and perimeter of the screen while the container rain hazard is active, and an intense red neon glow radiates from behind the paddle board.
* **Particles**: Deep red and white spark burst at the brick and on container impact; reddish heavy sludge dragging behind paddle during debuff.

## 21. Shun Brick (`brick_shun.webp`) - *Multiball*

### Purpose & Concept
The **Shun Brick** is an offensive multiball power-up featuring Shun. Upon destruction, it immediately launches an extra active ball into play with bright ice cyan & silver starburst effects to multiply the player's brick clearing speed.

### Core Mechanics
* **Instant Multiball Spawn**:
  * Spawns a new active ball directly from the center of the destroyed brick:
    ```javascript
    const speed = BASE_BALL_SPEED * this.speedMultiplier;
    const angle = (Math.random() - 0.5) * Math.PI * 0.5; // upward fan
    const newBall = this.spawnBall(
      false,
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      speed * Math.sin(angle),
      -Math.abs(speed * Math.cos(angle))
    );
    this.balls.push(newBall);
    ```
  * Multiple balls stay active simultaneously. You do not lose a life as long as at least one ball remains on screen.
* **Explosion Trigger**: If destroyed by an adjacent Q blast, Jio poison cascade, or Saigo/Enoki laser beam, the extra active ball launches into play immediately!
* **On-Brick Display**:
  * Displays cleanly as is with its original sprite asset (`images/brick_shun.webp`), with no distracting border overlays.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3`.
* **Floating Text**: Displays `EXTRA BALL!` in icy cyan (`#00c3e3`).
* **Particles**: Emits 24 electric ice cyan & silver starburst sparks (`#00c3e3`, `#ffffff`).

## 22. Magata Brick (`brick_magata.webp`) - *Nico Nico Danmaku Comments Debuff*

### Purpose & Concept
The **Magata Brick** is a sensory obstruction debuff brick featuring Magata. When broken, it activates a 30-second hazard that blocks the brick playfield area with a continuous stream of random **Nico Nico Douga** style flying comments moving from right to left, obscuring vision of bricks and balls. All comments, colors, sizes, and speeds are easily customizable via `magata_comments.json`.

### Core Mechanics
* **30-Second Nico Nico Douga Barrage**:
  * Upon destruction, activates `this.magataDebuff` for **30.0 seconds**.
  * A barrage of comments flies rapidly across the brick playfield from right to left across multiple staggered horizontal lanes.
  * When comments scroll past the left edge, they recycle from the right so the brick area remains flooded with comments for the full duration.
  * Authentic Nico Nico Douga styling: bold typography with black outlines and colorful fills.
* **Standout "MA☆GA☆TA" Comment**:
  * One special comment with text `"MA☆GA☆TA"` stands out distinctly:
    * Rendered in radiant neon pink (`#ff007f` / `#ff2a85`) with a pulsing neon pink glow aura.
    * Layered on top of all other comments (highest z-index).
    * Moves **very slowly** across the central lane of the brick field (`speed: 55px/s`).
* **Configurable JSON File (`magata_comments.json`)**:
  * Loaded at start so anyone can easily customize or add comments, sizes, colors, and speeds manually:
    ```json
    [
      { "text": "MA☆GA☆TA", "color": "#ff007f", "size": 44, "speed": 55, "standout": true },
      { "text": "wwwwwwwwwwwwwwwwwwww", "color": "#ffffff", "size": 28, "speed": 210 },
      { "text": "弾幕ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!", "color": "#00f3ff", "size": 28, "speed": 230 }
    ]
    ```
* **Cleansable by Koishi Brick**:
  * If the player breaks a Koishi Brick while the Danmaku debuff is active, all comments are immediately purified and cleared!
* **On-Brick Display**:
  * Displays cleanly as is with its original sprite asset (`images/brick_magata.webp`), without distracting overlays.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick_debuff.mp3`.
* **Floating Text**: Displays `MA☆GA☆TA DANMAKU (30S)!` in neon pink (`#ff007f`) on break, and `DANMAKU CLEARED` upon expiration.
* **Skill Cut-in**: Triggers glowing red debuff cut-in banner with `"Debuff"` badge.
* **Screen Visuals**: Full **pulsing debuff corner glow vignette** radiates across all 4 screen corners and borders for the full 30 seconds of the Danmaku hazard.
* **Particles**: 32 neon pink, magenta, and white sparks at the brick location upon destruction.

## 23. Ruriiro Brick (`brick_ruriiro.webp`) - *Illusion Swapper Debuff*

### Purpose & Concept
The **Ruriiro Brick** is an illusionary deception debuff brick. When broken, it turns the entire remaining brick field into an identical field of Ruriiro bricks. Among all the swapped bricks, exactly **one** is chosen as the **"Real" Ruriiro brick**, while all others become **"fake" Ruriiro bricks**. The player must find and destroy the Real Ruriiro brick to dispel the illusion and revert all surviving bricks back to their original types!

### Core Mechanics
* **Illusion Trigger**:
  * Breaking an initial Ruriiro debuff brick activates `this.ruriiroDebuff.active = true`.
  * Selects 1 random alive brick on the board to become the **"Real" Ruriiro brick** (`specialType: 'ruriiro_real'`).
  * Transforms all other surviving alive bricks into **"fake" Ruriiro bricks** (`specialType: 'ruriiro_fake'`).
  * Saves each brick's `previousState` (including original `isSpecial`, `isDebuff`, `specialType`, `image`, `hitsRequired`, and `hitsRemaining`).
  * All fake and real bricks display `images/brick_ruriiro.webp` so they look completely identical.
* **Fake Ruriiro Bricks (Normal Brick Behavior)**:
  * Fake Ruriiro bricks act strictly like normal bricks:
    * They award standard brick points (+100).
    * They break in 1 hit.
    * They trigger standard brick hit sounds and explosions, with **no special effect when broken**.
* **Real Ruriiro Brick (Reversion Dispel)**:
  * When the Real Ruriiro brick is hit and destroyed:
    * Reverts all surviving alive bricks back to their original state and images!
    * Any surviving special bricks (Q, Shun, Saori, Saigo, etc.) or multi-hit bricks resume their original identity and remaining hit counts.
    * Dispels the debuff screen glow.
* **Cleansable by Koishi Brick**:
  * If a Koishi brick is broken, it immediately dispels the Ruriiro illusion, reverting all alive bricks to their previous state.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick_debuff.mp3` on illusion trigger; `audio/special_brick.mp3` when the Real Ruriiro brick is destroyed and dispels the illusion.
* **Floating Text**: Displays `RURIIRO ILLUSION!` in deep azure blue (`#4d79ff`) on break, and `REAL FOUND! DISPELLED!` in bright cyan (`#00f3ff`) upon finding the Real brick.
* **Skill Cut-in**: Triggers glowing red debuff cut-in banner with `"Debuff"` badge.
* **Screen Visuals**: Displays the pulsating red debuff corner vignette while the illusion is active.
* **Particles**: 35 deep lapis/azure and white sparks on trigger; poof of smoke over all swapped bricks; 35 bright cyan and white sparkles when dispelled.

---

## 23. Hard Brick (`brick_hard.webp` & `brick_cracked.webp`) - *Reinforced 2-Hit Normal Brick*

### Purpose & Concept
The **Hard Brick** is a sturdy normal brick variant. Unlike special bricks, it does not grant skills or debuffs, but introduces durability variety into the normal brick pool. It requires **2 hits** to completely destroy, cracking upon the first hit and yielding higher points (+30) upon destruction.

### Core Mechanics
* **Spawn Distribution**:
  * Generated exclusively from the **normal brick pool** (36 normal bricks).
  * A random count between **5 and 10 bricks** per wave are selected as Hard Bricks (`images/brick_hard.webp`).
  * Normal brick classification (`isSpecial: false`), meaning it does not trigger skill cutin banners when broken.
* **Durability (2 Hits)**:
  * **Hit 1**:
    * Ball, turret laser, or Saori bullet reduces remaining hits from 2 to 1 (`hitsRemaining = 1`).
    * Instantly transmutes its sprite to **Cracked Brick** (`images/brick_cracked.webp`).
    * Triggers a momentary white hit flash wash (`hitFlashTimer = 0.35`).
    * Emits stone rubble and sparks (`#d0d0d0`, `#888888`).
  * **Hit 2 (Destruction)**:
    * Destroyed like standard bricks (`alive = false`).
    * Disintegrates with stone rubble and gold particles (`#e0e0e0`, `#ffcc00`).
    * Yields **+30 points** (`brick.points = 30`), instead of standard 10 points!
    * Floating score text displays `+30` in vibrant gold (`#ffcc00`), or `+1` in red (`#ff3344`) if the Ichinose debuff is active.
* **Full Damage Source Compatibility**:
  * **Ball Direct Hits**: Bounces off upon the 1st hit turning it cracked; destroys on the 2nd hit.
  * **Turret Lasers & Saori Bullets**: Bullet impacts reduce 1 hit and turn it cracked; subsequent bullet destroys it and awards +30 points.
  * **Explosions & Cascades (Q Bomb, Enoki, Saigo, Manami, Jio Poison)**: Explosive blasts and poison breaks award the full 30 points (`brick.points`).
  * **Ruriiro Illusion Preservation**: If an illusion is cast, original hard brick status, cracked state, and 30-point value are preserved in `previousState` and cleanly restored upon dispel.

### Sensory Feedback
* **Audio**: Plays `audio/hit.mp3` on both the 1st crack hit and final destruction hit.
* **Floating Text**: `+30` points on final destruction (no countdown text on cracked hit).
* **Visuals**: Distinct reinforced metal/stone plate sprite (`brick_hard.webp`) transitioning to fractured fissure sprite (`brick_cracked.webp`). White hit flash overlay on crack.

---

## 24. Haru Brick (`brick_haru.webp`) - *Power Resonance (Slow Motion & Ball Speed Reset)*

### Purpose & Concept
The **Haru Brick** introduces the **Power Resonance** skill. Breaking a Haru brick dilates time across the entire playfield, placing all active balls and falling items (Zero Hearts and Containers) into **slow motion for 2 seconds**. Once the 2-second slow motion completes, harmonic resonance normalizes all active balls back to their baseline default speed (`BASE_BALL_SPEED = 11.5`) and resets the global wave speed multiplier (`speedMultiplier = 1.0`).

### Core Mechanics
* **Skill Name**: `"Power Resonance"` (Configured in `skills_config.json`).
* **2-Second Slow Motion & Grayscale**:
  * Upon impact, activates `this.setSlowMotion(true)` (`this.haruSlowMotion = { active: true, timer: 2.0, duration: 2.0, slowFactor: 0.25 }`).
  * **Grayscale Shift**: Applies `-webkit-filter: grayscale(100%) contrast(1.12); filter: grayscale(100%) contrast(1.12)` to `#game-container`, turning the entire game world into a dramatic monochrome time-freeze for the 2 seconds!
  * **Balls**: Multiplies movement step by `0.25x`, keeping directional velocity smooth while dilating physics.
  * **Zero Hearts**: Slows downward gravity acceleration and velocity by `0.25x`.
  * **Containers**: Slows descent velocity and angular rotation by `0.25x`.
* **Velocity Normalization (After 2 Seconds)**:
  * When the 2 seconds expire, slow motion ends (`this.setSlowMotion(false)`), color smoothly fades back in, and all active balls (`this.balls`) have their velocities scaled back to baseline:
    ```javascript
    const ratio = BASE_BALL_SPEED / currentSpeed;
    ball.vx *= ratio;
    ball.vy *= ratio;
    ```
  * Resets `this.speedMultiplier = 1.0`.
* **Skill Cutin Integration**:
  * Triggers the animated skill cutin banner from the left side with Haru's icon (`images/brick_haru.webp`) and title `"POWER RESONANCE"`.

### Sensory Feedback
* **Audio**: Plays `audio/special_brick.mp3` on hit; plays resonance chime when speed normalization triggers.
* **Floating Text**: Displays `POWER RESONANCE!` in bright electric cyan (`#00e5ff`) followed by `SLOW MOTION (2s)!` on trigger, and `SPEED NORMALIZED!` when normal speed resumes.
* **Grayscale & Time Dilation Aura**: Transforms entire screen into cinematic monochrome with a pulsating cyan resonance border aura along the field perimeter during the 2 seconds of slow motion.
* **Ball Shockwave**: Spawns an expanding cyan and white resonance burst around each normalized ball (`#00e5ff`, `#ffffff`).
* **Brick Particles**: Radiates 30 electric cyan, sky blue, and radiant white sparkles (`#00e5ff`, `#76ffff`, `#ffffff`) on destruction.

---

## Wave Architecture & Lifecycle Flow

```mermaid
flowchart TD
    A[Round Spawn: 45 Bricks (9x5)] --> B[Pick 9 Special Brick Slots randomly]
    B --> C{For each of the 9 Special Bricks}
    C -->|Random Type| D[Yo Brick - Board Extender]
    C -->|Random Type| E[Zero Brick - 3-Bounce Zero Heart]
    C -->|Random Type| F[Tsuki Brick - Magnetism]
    C -->|Random Type| G[Q Brick - Adjacent Blast]
    C -->|Random Type| H[Kazuki Brick - Bottom Shield]
    C -->|Random Type| I[Miu Brick - Dual Turrets]
    C -->|Random Type| J[Jio Brick - Toxic Poison]
    C -->|Random Type| K[Enoki Brick - X-Line Blast]
    C -->|Random Type| L[Koishi Brick - Debuff Cleanser]
    C -->|Random Type| AR[Shun Brick - Multiball]
    C -->|Random Type| M[Eiji Brick - +1000 Points]
    C -->|Random Type| N[Saigo Brick - + Shape Blast]
    C -->|Random Type| Z[Hyakuichitaro Brick - Fire Ball]
    C -->|Random Type| AB[Tsuruko Brick - Gravity Field]
    C -->|Random Type (Debuff)| AD[Ichinose Brick - 1-Pt Debuff]
    C -->|Random Type| AF[Mita Brick - Board Speed Boost]
    C -->|Random Type| AG[Manami Brick - Warp Jump & Cross Blast]
    C -->|Random Type| AJ[Saori Brick - 5 Rapid Bullets]
    C -->|Random Type (Debuff)| AL[Akuta Brick - Damaged Board 1M]
    C -->|Random Type| AN[Taiga Brick - Green Gale Updraft]
    C -->|Random Type (Debuff)| AP[Sui Brick - Container Drop Debuff]
    C -->|Random Type (Debuff)| AT[Magata Brick - Danmaku Comments Debuff]
    C -->|Random Type (Debuff)| AV[Ruriiro Brick - Illusion Swapper Debuff]
    
    D --> O[Paddle expands to 284px for 30s]
    E --> P[Drops heavy Zero Heart; bounce 3x on paddle to convert to +1 Life (max 3)]
    F --> Q[1 Brick gets Magnet, Ball Homes in]
    G --> R[Explosion hits adjacent bricks]
    H --> S[Glowing Neon Light Blue Shield line active at bottom for 15s or until 1 hit deflection]
    I --> T[Dual Side Turrets shoot lasers every time ball bounces on board for 30s]
    J --> U[Poisons adjacent brick for 5s]
    K --> V[Hit 1 & 2: Countdown 2/1 in purple neon, Hit 3: X-Blast!]
    L --> W[Cleanses any active debuff; if no debuff running, does nothing!]
    AR --> AS[Spawns Extra Active Ball in play!]
    M --> X[Awards +1000 Bonus Points & Gold Particle Burst!]
    N --> Y[Hit 1 & 2: Countdown 2/1 in crimson neon, Hit 3: + Shape Blast!]
    Z --> AA[Ball turns to Fire Ball, pierces 5 bricks without bouncing!]
    AB --> AC[Pink transparent gravity field slows falling balls in bottom 30% for 15s!]
    AD --> AE[Debuff active for 60s: All points gained become 1 pt, Red corner screen glow!]
    AF --> AH[Paddle movement accelerated for 20s with golden neon aura!]
    AG --> AI[Physically jumps to random brick and blasts 5 bricks in + sign on impact!]
    AJ --> AK[Fires 5 sequential white round bullets straight up from center of board!]
    AL --> AM[Board shortened to bat_half.png (146px) for 60s with smoke & electric sparks!]
    AN --> AO[Surging green wind from bottom pushes all balls back into brick area instead of falling!]
    AP --> AQ[Drops 1 container every few seconds for 30s while spinning around; catching one slows board for 2s!]
    AT --> AU[Floods brick area with Nico Nico comments for 30s; standout MA☆GA☆TA moves slowly in pink!]
    AV --> AW[Swaps 1 random brick into Real Ruriiro & rest into fake; destroying Real reverts board!]
```

---

## File Reference & Code Hooks
- **Logic File**: `game.js`
  - Asset preload: `brick_ichinose`, `brick_mita`, `brick_manami`, `brick_saori`, `brick_akuta`, `brick_taiga`, `brick_sui`, `brick_magata`, `brick_ruriiro`, `brick_shun`, `container`, `bat_half`, `zero_heart`, `buff_skill_cutin`, `debuff_skill_cutin` in `loadAllAssetsWithProgress()`
  - Skill Cutin Config: `skills_config.json` dynamically loaded on startup with fallback defaults for all 24 skills, mapping skill names, buff/debuff types, and icon assets
  - Skill Cutin System: `this.skillCutins` manages active banners sliding in from left (`x: -360 -> 24`), 2-slot vertical stack ($Y = 960$ and $1057$), 1-second lifespan, and smooth fade-out
  - Comment Config: `magata_comments.json` dynamically fetched on startup with fallback defaults
  - Special Pool: `getSpecialBrickType()` includes all 23 special types with tuned weights
  - Debuff states: `this.pointDebuff` (Ichinose), `this.bat.isShortened` (Akuta), `this.boardSlowDebuff` & `this.suiContainerRain` (Sui), `this.magataDebuff` (Magata), and `this.ruriiroDebuff` (Ruriiro)
  - Speed boost state: `this.boardSpeedBoost = { active: false, timer: 0, multiplier: 1.75 }`
  - Wind surge state: `this.taigaWind` managing upward wind gale, streamer ribbons, and ball push
  - Container dropping: `this.suiContainerRain` (30s interval spawner) & `this.containers` (spinning falling entities)
  - Danmaku comments: `this.magataComments` moving right-to-left across brick area lanes
  - Illusion swapping: `this.triggerRuriiroDebuff()` saves brick states, designates Real and fake bricks, and `this.revertRuriiroIllusion()` dispels and reverts
  - Activation in `onSpecialBrickDestroyed()`: triggers `this.triggerSkillCutin(brick.specialType)`, activates skills, and manages debuff lifecycles
  - Audio: `playWindGale()`, `playDebuff()`, `playLaser()`, `playExplode()`, `playSpecialHit()`
  - Countdown badges & hit flashes: Enoki (`#bf00ff`) and Saigo (`#ff3300`) with live hits remaining counter (all other special bricks display cleanly as is)
- **Assets**:
  - `images/brick_yo.webp`
  - `images/brick_zero.webp`
  - `images/brick_tsuki.webp`
  - `images/brick_q.webp`
  - `images/brick_kazuki.webp`
  - `images/brick_miu.webp`
  - `images/brick_jio.webp`
  - `images/brick_enoki.webp`
  - `images/brick_koishi.webp`
  - `images/brick_shun.webp`
  - `images/brick_eiji.webp`
  - `images/brick_saigo.webp`
  - `images/brick_hyakuichitaro.webp`
  - `images/brick_tsuruko.webp`
  - `images/brick_ichinose.webp`
  - `images/brick_mita.webp`
  - `images/brick_manami.webp`
  - `images/brick_saori.webp`
  - `images/brick_akuta.webp`
  - `images/brick_taiga.webp`
  - `images/brick_sui.webp`
  - `images/brick_magata.webp`
  - `images/brick_ruriiro.webp`
  - `images/buff_skill_cutin.webp`
  - `images/debuff_skill_cutin.webp`
  - `images/container.webp`
  - `images/bat_half.webp`
  - `images/zero_heart.webp`
  - `images/turret.webp`
  - `images/bat_extended.webp`
  - `images/brick_hard.webp`
  - `images/brick_cracked.webp`
  - `images/brick_haru.webp`
  - `audio/special_brick_debuff.mp3`
  - `audio/System_Breach_3.mp3`




