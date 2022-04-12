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
    proxies += await (await fetch(`https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/${type}.txt`)).text();
    proxies += await (await fetch(`https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/${type}.txt`)).text();
    proxies += await (await fetch(`https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-${type}.txt`)).text();
    proxies += await (await fetch(`https://raw.githubusercontent.com/mmpx12/proxy-list/master/${type}.txt`)).text();
    if (type === "http") {
      proxies += await (await fetch(`https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list.txt`)).text();
      proxies += await (await fetch(`https://sunny9577.github.io/proxy-scraper/proxies.txt`)).text();
    }
  }
  proxies = sanitize(proxies);
  return proxies;
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

  let types = params.getAll("type");
  let limit = params.get("limit");
  const key = params.get("key");

  const keys = [];

  if (keys.length > 0) {
    if (!keys.includes(key)) {
      return new Response("invalid key", { status: 403 });
    }
  }

  if (types.length == 0) {
    types = ["http", "socks4", "socks5"];
  }

  for (let type of types) {
    if (!types.includes(type)) {
      return new Response("invalid proxy type", { status: 400 });
    }
  }

  if (limit && !Number.isInteger(parseInt(limit))) {
    return new Response("invalid limit", { status: 400 });
  }

  if (pathname.startsWith("/scrape")) {
    let proxies = await scrape(types, limit);
    if (limit > 0) {
      proxies = proxies.splice(0, limit);
    }
    return new Response(proxies.join("\n"), {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  if (pathname.startsWith("/check")) {
    let body = await request.text();
    let proxies = sanitize(body);
    let valid = await check(proxies, types);
    if (limit > 0) {
      valid = valid.splice(0, limit);
    }
    return new Response(valid.join("\n"), {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  if (pathname.startsWith("/aio")) {
    let proxies = await scrape(types);
    let valid = await check(proxies, types);
    if (limit > 0) {
      valid = valid.splice(0, limit);
    }
    return new Response(valid.join("\n"), {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}