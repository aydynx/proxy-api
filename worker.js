addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request).catch((err) => new Response(err.stack, { status: 500 })));
});

function sanitize(data) {
  let valid = [];
  let lines = data.replace("\r\n", "\n").split("\n");
  for (let line of lines) {
    line = line.trim();
    if (line.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5})$/)) {
      valid.push(line);
    }
  }
  return valid;
}

async function scrape(types) {
  let proxies;
  for (let type of types) {
    proxies += await (await fetch(`https://api.proxyscrape.com/v2/?request=getproxies&protocol=${type}&timeout=10000&country=all`)).text();
  }
  return sanitize(proxies);
}

async function check(proxies, types) {
  let chunks = [];
  let valid = [];

  for (let i = 0; i < proxies.length; i += 500) {
    chunks.push(proxies.slice(i, i + 500));
  }

  for (let chunk of chunks) {
    let formData = new FormData();

    for (let proxy of chunk) {
      formData.append("ip_addr[]", proxy);
    }

    let response = await fetch("https://api.proxyscrape.com/v2/online_check.php", {
      method: "POST",
      body: formData,
    });
    let json = await response.json();

    for (let p of json) {
      if (p.working && types.toString().includes(p.type)) {
        valid.push(p.ip + ":" + p.port);
      }
    }
  }
  return valid;
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const { pathname } = url;
  const params = new URLSearchParams(url.search);
  const types = params.getAll("type");

  for (let type of types) {
    if (type !== "http" || type !== "socks4" || type !== "socks5") {
      return new Response("invalid proxy type", { status: 500 });
    }
  }

  if (pathname.startsWith("/scrape")) {
    let text = await scrape(types);
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  if (pathname.startsWith("/check")) {
    let body = await request.text();
    let proxies = sanitize(body);
    let valid = await check(proxies, types);
    return new Response(valid.join("\n"), {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  if (pathname.startsWith("/aio")) {
    let proxies = await scrape(types);
    let valid = await check(proxies, types);
    return new Response(valid.join("\n"), {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
