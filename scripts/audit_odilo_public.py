#!/usr/bin/env python3
"""Public catalog diagnostics only; no logins, cookies, student data or scraping behind auth."""
import urllib.request, re, html, json, urllib.error
from html.parser import HTMLParser
class Reader(HTMLParser):
  def __init__(self):
    super().__init__();self.links=[];self.images=[];self.scripts=[];self.title=""
  def handle_starttag(self,t,a):
    d=dict(a)
    if t=="a" and d.get("href"):self.links.append((d.get("href"),d.get("title","")))
    if t=="img" and d.get("src"):self.images.append((d.get("src"),d.get("alt","")))
    if t=="script" and d.get("src"):self.scripts.append(d.get("src"))
for url in ["https://leiaparana.odilo.us/?locale=pt","https://leiaparana.odilo.us/info/entregas-expressas-da-kiki-00949378"]:
  print("\nURL",url,flush=True)
  try:
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; BibliotecaJoaquimMetadataCheck/1.0)"})
    with urllib.request.urlopen(req,timeout=20) as r:raw=r.read(2000000);s=raw.decode("utf8","replace");print("HTTP",r.status,"FINAL",r.url,"SIZE",len(raw),"TYPE",r.headers.get("content-type"),flush=True)
    rd=Reader();rd.feed(s)
    print("HTML_LENGTH",len(s),"SCRIPTS",len(rd.scripts),"IMAGES",len(rd.images),"LINKS",len(rd.links),flush=True)
    print("SCRIPTS",json.dumps(rd.scripts[:25],ensure_ascii=False))
    print("IMAGES",json.dumps(rd.images[:15],ensure_ascii=False))
    print("LINKS",json.dumps(rd.links[:25],ensure_ascii=False))
    for term in ["Diário de um Banana","Entregas expressas da Kiki","O Hobbit","__NEXT_DATA__","/info/","catalogue"]:
      m=re.search(re.escape(term),s,re.I)
      print("MATCH",term, bool(m),html.unescape(s[max(0,m.start()-260):m.end()+340]) if m else "",flush=True)
  except Exception as e:print("ERROR",type(e).__name__,str(e)[:500],flush=True)
