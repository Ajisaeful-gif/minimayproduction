async function parseResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Request backend gagal diproses.");
  }

  return payload;
}

export async function apiGet(url) {
  const response = await fetch(url, {
    cache: "no-store"
  });

  return parseResponse(response);
}

export async function apiSend(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return parseResponse(response);
}
