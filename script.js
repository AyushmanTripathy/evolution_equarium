const playground = document.querySelector("section");
const log = (s) => console.log(s);

const $ = (id) => document.getElementById(id);
const sheep_count = $("sheep_count")
const wolf_count = $("wolf_count")

let hash_code = 0;
let id;
let gender = 0;

const count = {
  sheep : 0,
  wolf : 0
}

const dirs = generateDirs();

init();
function init() {
  globalThis.eles = [];
  eles.push(createBody("sheep"));
  eles.push(createBody("sheep"));
  eles.push(createBody("sheep"));
  eles.push(createBody("sheep"));
  eles.push(createBody("sheep"));
  eles.push(createBody("sheep"));
  eles.push(createBody("wolf"));
  eles.push(createBody("wolf"));

  simulate(eles);
}

function simulate(arr) {
  id = setInterval(() => {
    for (const i in arr) {
      const copy = arr.slice();
      copy.splice(i, 1);
      frame(arr[i], copy);
    }
    if (eles.length > 20 || eles.length == 0) stop();
  }, 200);
}

function frame(ele, copy) {
  ele.style["border-color"] = "#bbb";

  // pregnant female
  if (!ele.male && ele.childNodes[0].pregnant) {
    ele.childNodes[0].pregnant += 1;
    let preg = ele.childNodes[0].pregnant;

    if (preg < 3) ele.childNodes[0].style["border-color"] = "blue";
    else if (preg == 40) {
      log("birth : " + ele.type);
      ele.childNodes[0].style["border-color"] = "green";
      eles.push(createBody(ele.type));
      ele.childNodes[0].pregnant = null;
    }
  }

  // fleeing
  if (ele.fleeing) {
    if (checkCollision(ele, ele.fleeing)) {
      ele.vel = bestDir(ele.childNodes[0], ele.fleeing, true);
      ele.style["border-color"] = "red";
      return ele.move(ele.vel);
    } else ele.fleeing = null;
  }

  // following and still in reach
  if (ele.following && checkCollision(ele, ele.following)) {
    // check if reached
    if (checkCollision(ele.childNodes[0], ele.following)) {
      // found
      ele[ele.following.type](ele.following);
      ele.following = null;
      return null;
    } else {
      // follow
      ele.vel = bestDir(ele.childNodes[0], ele.following);
      ele.style["border-color"] = "green";
      return ele.move(ele.vel);
    }
  }

  // look around
  for (let against of copy) {
    against = against.childNodes[0];
    const result = checkCollision(ele, against);
    if (result) {
      ele.style["border-color"] = "yellow";

      // check for predator
      if (ele.flee.includes(against.type)) {
        ele.following = null;
        ele.fleeing = against;
        // reproduce
      } else if (
        ele.type == against.type &&
        ele.male &&
        !against.pregnant &&
        !against.male
      )
        ele.following = against;
      // check for food
      else if (ele.follow.includes(against.type)) ele.following = against;
      //else log(against.type + " unknown type");
    }
  }

  // move randomly
  ele.vel = randomVel();
  ele.move(ele.vel);
}

function bestDir(pos, goal, opp) {
  pos = pos.getBoundingClientRect();
  goal = goal.getBoundingClientRect();

  let best = opp ? 0 : Infinity;
  let bestDir;

  for (const dir of dirs) {
    const distance = dist(
      {
        x: pos.x + dir.x,
        y: pos.y + dir.y,
      },
      goal
    );
    if (opp ? best < distance : best > distance) {
      best = distance;
      bestDir = dir;
    }
  }

  if (!bestDir) throw "no best dir found";
  return bestDir;
}

function createBody(type) {
  count[type] += 1;
  updateCount();

  gender = gender ? 0 : 1;
  const body = document.createElement("div");
  const head = document.createElement("img");
  const hash_id = hash();

  head.setAttribute("id", hash_id);

  body.setAttribute("id", hash_id);
  body.x = random(10, 90);
  body.y = random(10, 90);
  body.following = null;
  body.vel = randomVel();

  head.type = type;
  head.male = gender;
  body.type = type;
  body.male = gender;

  head.classList.add("gender" + gender);
  body.classList.add(type + "_body");
  head.classList.add(type + "_head");

  body.move = ({ x = 0, y = 0 }) => {
    body.x += x * body.speed;
    body.y += y * body.speed;
    body.style.top = body.y + "%";
    body.style.left = body.x + "%";
  };

  switch (type) {
    case "wolf":
      head.setAttribute("src", "./wolf.png");
      body.speed = 1;
      body.flee = [];
      body.follow = ["sheep"];
      body.wolf = (wolf) => {
        if (!wolf.male) wolf.pregnant = 1;
      };
      body.sheep = (sheep) => {
        remove(sheep.parentNode)
        eles.splice(eles.indexOf(sheep.parentNode), 1);
      };
      break;
    case "sheep":
      head.setAttribute("src", "./sheep.png");
      body.speed = 0.7;
      body.flee = ["wolf"];
      body.follow = [];
      body.sheep = (sheep) => {
        if (!sheep.male) sheep.pregnant = 1;
      };
      break;
  }
  head.classList.add("head");
  body.appendChild(head);
  body.classList.add("body");

  body.move({});
  playground.appendChild(body);
  return body;
}

function remove (ele) {
  count[ele.type] += -1
  updateCount();
  ele.remove();
}

function checkCollision(a, b) {
  if (!a || !b) return null;
  const rect1 = a.getBoundingClientRect();
  const rect2 = b.getBoundingClientRect();
  const isInHoriztonalBounds =
    rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x;
  const isInVerticalBounds =
    rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
  return isInHoriztonalBounds && isInVerticalBounds;
}

function randomVel() {
  return {
    x: random(-1, 1),
    y: random(-1, 1),
  };
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function hash() {
  hash_code += 1;
  return "hash" + hash_code;
}

function stop() {
  return clearInterval(id);
}

function dist(a, b) {
  // distance formula
  // ???[(x2 ??? x1)2 + (y2 ??? y1)2]
  const dist = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  return Math.sqrt(dist);
}

function generateDirs() {
  const dirs = [];
  for (let x = -1; x != 2; x++) {
    for (let y = -1; y != 2; y++) {
      dirs.push({ x, y });
    }
  }
  dirs.splice(4, 1);
  return dirs;
}

function updateCount() {
  sheep_count.innerHTML = count.sheep;
  wolf_count.innerHTML = count.wolf;
}
