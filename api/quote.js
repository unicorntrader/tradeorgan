export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    res.status(400).json({ error: "Missing ticker" });
    return;
  }

  const symbol = ticker.toLowerCase().endsWith(".us")
    ? ticker.toLowerCase()
    : `${ticker.toLowerCase()}.us`;

  const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=csv`;

  try {
    const resp = await fetch(url);
    const text = await resp.text();
    const rows = text.trim().split(/\r?\n/);
    if (rows.length < 2) {
      res.status(404).json({ error: "No data returned" });
      return;
    }

    const cols = rows[1].split(",");
    const closeStr = (cols[6] || "").trim();
    const price = parseFloat(closeStr);

    if (isNaN(price)) {
      res.status(500).json({ error: "Invalid price" });
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", "*"); // enable CORS
    res.json({ ticker: symbol, price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
