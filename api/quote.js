export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight (OPTIONS) request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // --- Extract ticker ---
  const { ticker } = req.query;
  if (!ticker) {
    res.status(400).json({ error: "Missing ticker" });
    return;
  }

  // Normalize ticker for Stooq
  const symbol = ticker.toLowerCase().endsWith(".us")
    ? ticker.toLowerCase()
    : `${ticker.toLowerCase()}.us`;

  const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=csv`;

  try {
    // Fetch CSV from Stooq
    const resp = await fetch(url);
    const text = await resp.text();

    // Split rows by line
    const rows = text.trim().split(/\r?\n/);
    if (rows.length < 2) {
      res.status(404).json({ error: "No data returned" });
      return;
    }

    // Parse second row
    const cols = rows[1].split(",");
    const closeStr = (cols[6] || "").trim(); // column 6 = Close
    const price = parseFloat(closeStr);

    if (isNaN(price)) {
      res.status(500).json({ error: "Invalid price" });
      return;
    }

    // Success
    res.status(200).json({ ticker: symbol, price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
