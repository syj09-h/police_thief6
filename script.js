const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height;
const cols=24,rows=24;
const cellSize=Math.floor(W/cols);
let maze=[];
let player={x:1,y:1};
let chaser={x:cols-2,y:rows-2};
let exitCell={x:cols-2,y:1};
let keys={};
let startTime=performance.now();
let score=0,lives=3;
let gameOver=false;


function initMaze(){
maze=Array(rows).fill(0).map(()=>Array(cols).fill(1));
for(let r=1;r<rows;r+=2){for(let c=1;c<cols;c+=2){maze[r][c]=0;}}
const stack=[{r:1,c:1}];
const visited=new Set(['1,1']);
while(stack.length){
const cur=stack.at(-1);
const dirs=[[0,2],[0,-2],[2,0],[-2,0]];
const neighbors=dirs.map(d=>({r:cur.r+d[0],c:cur.c+d[1],between:[cur.r+d[0]/2,cur.c+d[1]/2]}))
.filter(n=>n.r>0&&n.r<rows&&n.c>0&&n.c<cols&&!visited.has(`${n.r},${n.c}`));
if(neighbors.length){
const pick=neighbors[Math.floor(Math.random()*neighbors.length)];
maze[pick.between[0]][pick.between[1]]=0;
visited.add(`${pick.r},${pick.c}`);
stack.push({r:pick.r,c:pick.c});
} else stack.pop();
}
player=findOpen(1); chaser=findOpen(2); exitCell=findOpen(3);
startTime=performance.now(); score=0; gameOver=false; lives=3;
document.getElementById('lives').textContent=lives;
}


function findOpen(seed){for(let i=0;i<1000;i++){let r=1+Math.floor(Math.random()*(rows-2));let c=1+Math.floor(Math.random()*(cols-2));if(maze[r][c]===0)return{x:c,y:r};}return{x:1+seed,y:1+seed};}
function draw(){ctx.clearRect(0,0,W,H);for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){ctx.fillStyle=maze[r][c]===1?'#263246':'#071827';ctx.fillRect(c*cellSize,r*cellSize,cellSize,cellSize);}}ctx.fillStyle='#34d399';ctx.fillRect(exitCell.x*cellSize+cellSize*0.25,exitCell.y*cellSize+cellSize*0.25,cellSize*0.5,cellSize*0.5);ctx.beginPath();ctx.fillStyle='var(--player)';ctx.arc(player.x*cellSize+cellSize/2,player.y*cellSize+cellSize/2,cellSize*0.35,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle='var(--chaser)';ctx.arc(chaser.x*cellSize+cellSize/2,chaser.y*cellSize+cellSize/2,cellSize*0.35,0,Math.PI*2);ctx.fill();}
function neighborsOf(cell){return[[0,1],[0,-1],[1,0],[-1,0]].map(d=>({x:cell.x+d[0],y:cell.y+d[1]})).filter(n=>n.y>=0&&n.y<rows&&n.x>=0&&n.x<cols&&maze[n.y][n.x]===0)}
function astar(start,goal){const closed=new Set();const open=new Map();function h(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}open.set(`${start.x},${start.y}`,{pos:start,g:0,f:h(start,goal),parent:null});while(open.size){let curK,cur;for(const[k,v]of open){if(!cur||v.f<cur.f){cur=v;curK=k}}if(cur.pos.x===goal.x&&cur.pos.y===goal.y){const path=[];let n=cur;while(n){path.push(n.pos);n=n.parent;}return path.reverse();}open.delete(curK);closed.add(curK);for(const n of neighborsOf(cur.pos)){const nk=`${n.x},${n.y}`;if(closed.has(nk))continue;const g=cur.g+1;const existing=open.get(nk);const f=g+h(n,goal);if(!existing||g<existing.g){open.set(nk,{pos:n,g,f,parent:cur});}}}return null;}
let lastTick=performance.now();
let moveDelay=0; // 플레이어 속도 제어용
function update(){const now=performance.now();const dt=(now-lastTick)/1000;lastTick=now;if(!gameOver){const elapsed=(now-startTime)/1000;document.getElementById('time').textContent=elapsed.toFixed(1);document.getElementById('score').textContent=score;moveDelay+=dt;if(moveDelay>0.15){ // 속도 느리게 조정
const move={x:0,y:0};
if(keys['ArrowUp']||keys['w'])move.y=-1;
if(keys['ArrowDown']||keys['s'])move.y=1;
if(keys['ArrowLeft']||keys['a'])move.x=-1;
if(keys['ArrowRight']||keys['d'])move.x=1;
if(move.x||move.y){tryMovePlayer(move.x,move.y);moveDelay=0;}}
if(Math.random()<0.1){const path=astar(chaser,player);if(path&&path.length>1){chaser.x=path[1].x;chaser.y=path[1].y;}}
if(player.x===chaser.x&&player.y===chaser.y){lives--;document.getElementById('lives').textContent=lives;if(lives<=0){gameOver=true;alert('패배했습니다... 새 게임을 눌러 다시 시도하세요.');}else{player=findOpen(1);}}
if(player.x===exitCell.x&&player.y===exitCell.y){score+=Math.max(1,Math.round(100-((now-startTime)/1000)));alert('탈출 성공! 점수: '+score);gameOver=true;}}
draw();requestAnimationFrame(update);}
function tryMovePlayer(dx,dy){const nx=player.x+dx,ny=player.y+dy;if(ny>=0&&ny<rows&&nx>=0&&nx<cols&&maze[ny][nx]===0){player.x=nx;player.y=ny;}}
window.addEventListener('keydown',e=>{keys[e.key]=true;});window.addEventListener('keyup',e=>{keys[e.key]=false;});document.querySelectorAll('.dir').forEach(el=>{el.addEventListener('touchstart',e=>{e.preventDefault();handleDir(el.dataset.dir);});el.addEventListener('mousedown',e=>{e.preventDefault();handleDir(el.dataset.dir);});});function handleDir(d){if(d==='up')tryMovePlayer(0,-1);if(d==='down')tryMovePlayer(0,1);if(d==='left')tryMovePlayer(-1,0);if(d==='right')tryMovePlayer(1,0);}
document.getElementById('resetBtn').addEventListener('click',()=>{initMaze();});document.getElementById('regenBtn').addEventListener('click',()=>{initMaze();});function fitCanvas(){const size=Math.min(window.innerWidth-40,720);canvas.width=size;canvas.height=size;}window.addEventListener('resize',()=>{fitCanvas();draw();});fitCanvas();initMaze();lastTick=performance.now();requestAnimationFrame(update);