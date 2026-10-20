from html.parser import HTMLParser
from pathlib import Path
import re,json,hashlib
BASE=Path(__file__).resolve().parents[1]
SOURCE=BASE/'sources'/'lei-15388-camara.html'
ROWS=BASE/'sources'/'numbered-rows.json'
CATALOG=BASE/'data'/'pne-catalog.json'
class Rows(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.row=None; self.cell=None
    def handle_starttag(self,tag,attrs):
        if tag=='tr': self.row=[]
        if tag in ('td','th') and self.row is not None: self.cell=[]
        if tag in ('br','p') and self.cell is not None: self.cell.append(' ')
    def handle_endtag(self,tag):
        if tag in ('td','th') and self.cell is not None:
            self.row.append(re.sub(r'\s+',' ',''.join(self.cell)).strip()); self.cell=None
        if tag=='tr' and self.row is not None:
            self.rows.append(self.row); self.row=None
    def handle_data(self,data):
        if self.cell is not None: self.cell.append(data)
p=Rows(); raw=SOURCE.read_text(); p.feed(raw)
numbered=[]
for i,row in enumerate(p.rows):
    if row and re.match(r'^(Objetivo\s+\d+|Meta\s+\d+\.[a-z]\.|Estratégia\s+\d+\.\d+\.)$',row[0]):
        numbered.append({'label':row[0],'text':' '.join(row[1:]),'sourceRow':i+1})
counts={k:sum(x['label'].startswith(k) for x in numbered) for k in ['Objetivo','Meta','Estratégia']}
print('rows',len(p.rows),'counts',counts)
print('first',numbered[:3]);print('last',numbered[-2:])
ROWS.write_text(json.dumps(numbered,ensure_ascii=False,indent=2)+'\n')
assert counts=={'Objetivo':19,'Meta':73,'Estratégia':372}, counts
assert len({x['label'] for x in numbered})==len(numbered)
assert all(x['text'] for x in numbered)
objectives=[]
for x in numbered:
    if x['label'].startswith('Objetivo'):
        current={'id':int(re.search(r'\d+',x['label'])[0]),'label':x['label'],'text':x['text'],'sourceRow':x['sourceRow'],'goals':[],'strategies':[]};objectives.append(current)
    else:
        assert int(re.search(r'\d+',x['label'])[0])==current['id']
        ident=x['label'].split(' ',1)[1]
        current['goals' if x['label'].startswith('Meta') else 'strategies'].append({'id':ident,**x})
assert [x['id'] for x in objectives]==list(range(1,20))
result={'source':{'url':'https://www2.camara.leg.br/legin/fed/lei/2026/lei-15388-14-abril-2026-798950-normaatualizada-pl.html','law':'Lei nº 15.388, de 14 de abril de 2026','annex':'Anexo I','sha256':hashlib.sha256(raw.encode()).hexdigest(),'extraction':'HTML table cells; whitespace normalized only; literal labels and punctuation preserved; strategies grouped by objective, not by goal.'},'counts':counts,'objectives':objectives}
CATALOG.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('catalog verified',len(numbered),'rows; no strategy-to-goal relationship inferred')
