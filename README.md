# proxy aio api
worker for cloudflare workers that scrapes proxies  
code + docs made in under 30 mins maybe ill add more  

## setup
copy and paste worker.js into ur own

## use
### params
the type parameter is what proxies u want
you can specify multiple if you want more than 1

### endpoint
/check
checks proxies of type  
only need list of proxies seperated by newline in post body

/scrape
scrapes proxies of type  

/aio
scrapes + checks proxies of type  

example:
`https://workername.namespace.workers.dev/aio?type=socks5`  
would scrape and check socks5  

`https://workername.namespace.workers.dev/aio?type=http&type=socks4`  
scrapes both http and socks4 proxies
