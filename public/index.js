document.getElementById('price-display').textContent = '2345.67';

document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = document.getElementById('investment-amount').value;
  if (!amount) return;

  const user = { investment: Number(amount), date: new Date().toISOString() };

  await fetch('http://localhost:4000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });

  const dialog = document.querySelector('dialog');
  dialog.querySelector('#investment-summary').textContent =
    `You just bought ${(amount / 2345.67).toFixed(2)} ounces (ozt) for £${amount}. \nYou will receive documentation shortly.`;
  dialog.showModal();
});

document.querySelector('dialog button').onclick = () => {
  document.querySelector('dialog').close();
};

const priceDisplay = document.getElementById('price-display')
const statusDisplay = document.getElementById('connection-status')
let connected = false

function setDisconnected() {
  priceDisplay.textContent = '----.--'
  statusDisplay.textContent = 'Disconnected 🔴'
}

async function fetchPrice() {
  try {
    const res = await fetch('/api/price')
    const data = await res.json()
    priceDisplay.textContent = data.price.toFixed(2)
    statusDisplay.textContent = 'Live Price 🟢'
  } catch {
    setDisconnected()
  }
}

setDisconnected()

document.querySelector('.price-info-container').addEventListener('click', () => {
  if (!connected) {
    connected = true
    fetchPrice()
    setInterval(() => {
      if (connected) fetchPrice()
    }, 10000)
  }
})

