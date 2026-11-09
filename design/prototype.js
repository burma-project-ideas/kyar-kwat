// shortcut: static review positions only, replace with the C# rules engine during Blazor implementation.
const $ = selector => document.querySelector(selector);
const settings = { mode: 'normal', opponent: 'computer', level: 'Medium' };
const names = { normal: 'ကျားနိုင်', reverse: 'ကျားကုန်' };
const objectives = {
  normal: 'ပြိုင်ဘက်ရဲ့ ကျားတွေကို စားပြီး အနိုင်ယူပါ။',
  reverse: 'ကိုယ့်ကျားတွေကို စားအောင် ခင်းပေးပြီး အနိုင်ယူပါ။'
};
const details = {
  normal: 'ပြိုင်ဘက်မှာ ကျားမကျန်တော့ရင်၊ ဒါမှမဟုတ် ရွှေ့စရာ မရှိတော့ရင် သင်နိုင်ပါတယ်။',
  reverse: 'ကိုယ့်ကျား မကျန်တော့ရင်၊ ဒါမှမဟုတ် ကိုယ်ရွှေ့စရာ မရှိတော့ရင် ကိုယ်နိုင်ပါတယ်။'
};
let position = [];
let selected = null;
let scene = 'ready';

function fixture(state) {
  const board = Array(64).fill(null);
  if (state === 'ready' || state === 'thinking') {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 && (r < 3 || r > 4)) board[r * 8 + c] = { side: r < 3 ? 'ivory' : 'green' };
    }
  } else if (state === 'capture') {
    for (const index of [1, 5, 10, 19, 28]) board[index] = { side: 'ivory' };
    for (const index of [35, 40, 44, 49, 53, 58]) board[index] = { side: 'green' };
    board[58].king = true;
  } else if (state === 'draw') {
    board[17] = { side: 'green', king: true };
    board[46] = { side: 'ivory', king: true };
  } else if (state === 'blocked') {
    const blocked = settings.mode === 'reverse' ? 'green' : 'ivory';
    const other = blocked === 'green' ? 'ivory' : 'green';
    for (const index of blocked === 'green' ? [1, 3] : [56, 58]) board[index] = { side: blocked };
    board[35] = { side: other };
  } else if (settings.mode === 'reverse') {
    for (const index of [1, 10, 19, 28]) board[index] = { side: 'ivory' };
    board[1].king = true;
  } else {
    for (const index of [17, 35, 44, 53]) board[index] = { side: 'green' };
    board[17].king = true;
  }
  return board;
}

function renderBoard() {
  const board = $('#board');
  const focused = document.activeElement?.dataset?.index;
  board.replaceChildren();
  const destinations = selected === 40 && scene === 'ready' ? [33] : selected === 35 && scene === 'capture' ? [21] : [];
  position.forEach((piece, index) => {
    const row = Math.floor(index / 8), col = index % 8;
    const square = document.createElement('button');
    square.type = 'button';
    square.className = `square ${(row + col) % 2 ? 'dark' : 'light'}${selected === index ? ' selected' : ''}${destinations.includes(index) ? ' destination' : ''}`;
    square.dataset.index = index;
    square.disabled = !['ready', 'capture'].includes(scene) || !((row + col) % 2);
    const description = piece ? `${piece.side === 'green' ? 'အစိမ်းကျား' : 'အဖြူကျား'}${piece.king ? ' ကင်း' : ''}` : destinations.includes(index) ? 'ရွှေ့နိုင်သောကွက် နမူနာ' : 'အလွတ်';
    square.setAttribute('aria-label', `${String.fromCharCode(97 + col)}${8 - row} · ${description}`);
    square.setAttribute('aria-pressed', String(selected === index));
    if (piece) {
      const counter = document.createElement('span');
      counter.className = `counter ${piece.side}`;
      counter.setAttribute('aria-hidden', 'true');
      if (piece.king) counter.innerHTML = '<span class="king-letter">က</span>';
      square.append(counter);
    }
    square.addEventListener('click', () => {
      if (piece?.side !== 'green') return;
      selected = index;
      $('#turn-description').textContent = 'ရွေးထားသောကျားနဲ့ ရွှေ့နိုင်သောကွက်ကို ပြထားပါတယ်။ ဤခုံသည် design နမူနာသာ ဖြစ်ပါတယ်။';
      renderBoard();
    });
    board.append(square);
  });
  if (focused !== undefined) board.querySelector(`[data-index="${focused}"]`)?.focus();
}

function render(state = 'ready') {
  scene = state;
  $('#preview-state').value = state;
  selected = state === 'capture' ? 35 : null;
  position = fixture(state);
  const local = settings.opponent === 'local';
  const terminal = ['win', 'blocked', 'draw'].includes(state);
  const winner = local ? 'အစိမ်းကျား ကစားသမား အနိုင်ရပါတယ်။' : 'သင် အနိုင်ရပါတယ်။';
  $('#mode-title').textContent = names[settings.mode];
  $('#objective').textContent = objectives[settings.mode];
  $('#objective-heading').textContent = `${names[settings.mode]}မှာ ဘယ်လိုနိုင်မလဲ။`;
  $('#objective-detail').textContent = details[settings.mode];
  $('#summary-mode').textContent = names[settings.mode];
  $('#summary-opponent').textContent = local ? 'နှစ်ယောက်' : 'စက်';
  $('#summary-level').textContent = settings.level;
  $('#summary-level-row').hidden = local;
  $('#human-name').textContent = local ? 'အစိမ်းကျား ကစားသမား' : 'သင်';
  $('#opponent-name').textContent = local ? 'အဖြူကျား ကစားသမား' : 'စက်ကစားသမား';
  $('#opponent-level').textContent = local ? 'တစ်စက်တည်းမှာ နှစ်ယောက်ကစားခြင်း' : settings.level;
  $('#human-count').textContent = position.filter(p => p?.side === 'green').length;
  $('#opponent-count').textContent = position.filter(p => p?.side === 'ivory').length;
  $('#capture-notice').hidden = state !== 'capture';
  $('#turn-title').textContent = terminal ? (state === 'draw' ? 'သရေဖြစ်ပါတယ်။' : winner) : state === 'thinking' ? (local ? 'အဖြူကျားအလှည့်ပါ' : 'စက်က စဉ်းစားနေပါတယ်') : local ? 'အစိမ်းကျားအလှည့်ပါ' : 'သင့်အလှည့်ပါ';
  $('#turn-description').textContent = state === 'capture' ? 'ရွေးထားသောကျားနဲ့ ဆက်စားရမည့်ကွက်ကို ကြည့်ပါ။' : state === 'thinking' ? (local ? 'အဖြူကျားကို ရွှေ့ရန် အသင့်ဖြစ်ပါပြီ။' : `${settings.level} · ပြိုင်ဘက်ရဲ့ရွှေ့ကွက်ကို စောင့်ပါ။`) : terminal ? 'ဂိမ်းအသစ်စပြီး ထပ်ကစားနိုင်ပါတယ်။' : 'အစိမ်းကျားတစ်ကောင်ကို ရွေးပါ။';
  renderBoard();
  if (terminal) {
    $('#result-title').textContent = state === 'draw' ? 'သရေဖြစ်ပါတယ်။' : winner;
    $('.result-mark').hidden = state === 'draw';
    $('#result-mode').textContent = names[settings.mode];
    $('#result-count').textContent = $('#human-count').textContent;
    $('#result-reason').textContent = state === 'draw' ? 'ကျားမစားဘဲ ကင်းသာ တစ်ဖက်စီ ၂၅ ကြိမ်ဆက်တိုက် ရွှေ့ခဲ့လို့ သရေဖြစ်ပါတယ်။' : state === 'blocked' ? (settings.mode === 'reverse' ? 'ကိုယ်ရွှေ့စရာ မရှိတော့လို့ ကျားကုန်မှာ ကိုယ်နိုင်ပါတယ်။' : 'ပြိုင်ဘက်မှာ ရွှေ့စရာ မရှိတော့လို့ ကျားနိုင်မှာ ကိုယ်နိုင်ပါတယ်။') : settings.mode === 'reverse' ? 'ကိုယ့်ကျား တစ်ကောင်မှ မကျန်တော့လို့ ကျားကုန်မှာ ကိုယ်နိုင်ပါတယ်။' : 'ပြိုင်ဘက်ရဲ့ ကျားအားလုံးကို စားပြီးလို့ ကျားနိုင်မှာ ကိုယ်နိုင်ပါတယ်။';
    $('#result-dialog').showModal();
  }
}

function openSetup() {
  const form = $('#setup-form');
  for (const [name, value] of Object.entries(settings)) form.elements[name].value = value;
  updateSetup();
  $('#setup-dialog').showModal();
}

function updateSetup() {
  const form = $('#setup-form');
  const local = form.elements.opponent.value === 'local';
  $('#difficulty-field').hidden = local;
  $('#difficulty-field').disabled = local;
  $('#setup-objective').textContent = details[form.elements.mode.value];
  $('#level-description').textContent = {
    Easy: 'အခြေခံရွှေ့ကွက်တွေနဲ့ ပေါ့ပေါ့ပါးပါး ကစားကြည့်ပါ။',
    Medium: 'ရှေ့ဆက်ရွှေ့ကွက်တွေကို ကြိုတွက်ပြီး ကစားပါမယ်။',
    Hard: 'ရွှေ့ကွက်တွေကို ပိုနက်နက် ကြိုတွက်ကစားပါမယ်။'
  }[form.elements.level.value];
}

$('#new-game').addEventListener('click', openSetup);
$('#change-settings').addEventListener('click', openSetup);
$('#setup-form').addEventListener('change', updateSetup);
$('#setup-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  for (const name of Object.keys(settings)) settings[name] = form.elements[name].value;
  $('#setup-dialog').close();
  render();
});
for (const id of ['#open-rules', '#more-rules']) $(id).addEventListener('click', () => $('#rules-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#play-again').addEventListener('click', () => { $('#result-dialog').close(); render(); });
$('#preview-state').addEventListener('change', event => render(event.target.value));
render();
