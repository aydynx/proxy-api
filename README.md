# proxy aio api
worker for cloudflare workers that scrapes proxies from multiple services, and even checks them!  
supports large lists, and on average returns about 1k-3k VALID proxies depending on what protocol you use  
large request time however, on average 5-8k ms when using the aio endpoint...  

## setup
copy and paste worker.js into ur own worker  
no cron triggers or anything fancy needed  
alternatively, deploy this using the wrangler cli

## use
### endpoints
**/check**  
checks proxies of type  
only need list of proxies seperated by newline in post body

**/scrape**  
scrapes proxies of type  

**/aio**  
scrapes + checks proxies of type  

### params
**?type={http|socks4|socks5}**  
what proxies u want  
you can use this parameter multiple times if you want more than just 1 type (mixed)

**?limit=[int]**  
changes internal meaning depending on endpoint  
if scrape, it returns limit number of unchecked proxies  
if check or aio, it returns limit number of valid proxies  

**?key=[key]**  
you can add your key to the array of keys if you would like to limit access to your proxy worker  
if you would like it to be public, just delete all of the keys within the keys array near the top of `handleRequest`

### examples
`https://workername.namespace.workers.dev/aio?type=socks5`  
manages scraping and checking, and returns a list of all socks5 proxies it scraped

`https://workername.namespace.workers.dev/aio?type=socks4&type=socks5`  
returns a mixed checked list of socks4 and socks5, in the order they were scraped

`https://workername.namespace.workers.dev/aio?type=http&limit=1`  
returns a single checked http proxy

`https://workername.namespace.workers.dev/check?type=socks4`  
if a list of proxies seperated by newline was sent as the body of the post request, it returns a list of all the valid proxies in your list

`https://workername.namespace.workers.dev/scrape`
scrapes ALL types of proxy  