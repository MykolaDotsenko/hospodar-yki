#!/usr/bin/env python3
"""Verify brand consistency, SVG integrity and basic WCAG color choices.

This is STATIC coverage only. Real recognition, browser screenshots, typography,
trademark clearance and assistive-technology checks remain human acceptance gates.
"""
from __future__ import annotations
import json
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
TOKENS=ROOT/"brand/tokens.json"
MARK=ROOT/"brand/logo/hospodar-yki-mark.svg"
LOCKUP=ROOT/"brand/logo/hospodar-yki-lockup.svg"
MONO=ROOT/"brand/logo/hospodar-yki-mark-mono.svg"
CSS=ROOT/"app/styles.css"
HTMLS=[ROOT/"app/index.html",ROOT/"app/exam.html"]

def text(path:Path)->str:
    assert path.is_file(), f"Missing {path}"
    return path.read_text(encoding="utf-8")

def luminance(hex_color:str)->float:
    h=hex_color.lstrip("#")
    assert len(h)==6
    rgba=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    rgb=[v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4 for v in rgba]
    return sum(a*b for a,b in zip((0.2126,0.7152,0.0722),rgb))

def contrast(a:str,b:str)->float:
    aa,bb=sorted((luminance(a),luminance(b)))
    return (bb+0.05)/(aa+0.05)

def main():
    t=json.loads(text(TOKENS))
    assert t["version"]=="0.2.0"
    assert t["concept"]=="Відкритий поріг / The open threshold"
    for role in ("primary","accent","paper","forest","ink","surface","learn_tint","exam_tint"):
        assert t["colors"][role].startswith("#")
    for s in ("learn","exam"):
        assert t["mode_identity"][s]["accent"].startswith("#")
        assert t["mode_identity"][s]["tint"].startswith("#")
    for a,b in [
       ("primary","surface"),("ink","paper"),("forest","learn_tint"),
       ("primary","exam_tint"),("muted","surface")
    ]:
        value=contrast(t["colors"][a],t["colors"][b])
        assert value>=4.5, f"Contrast below AA: {a} on {b} = {value:.2f}"
    # Gold is signature decoration; it is intentionally not allowed as small-on-white text.
    assert contrast(t["colors"]["accent"],t["colors"]["surface"])<4.5
    for path in (MARK,LOCKUP,MONO):
        svg=ET.fromstring(text(path))
        assert svg.tag=="{http://www.w3.org/2000/svg}svg"
        assert svg.attrib.get("viewBox")
        assert svg.find("{http://www.w3.org/2000/svg}title") is not None
        assert svg.find("{http://www.w3.org/2000/svg}desc") is not None
    assert "Hospodar" in text(LOCKUP)
    assert "#C99135" in text(MARK)
    assert "#C99135" not in text(MONO)
    for html in HTMLS:
        page=text(html)
        assert page.count("../brand/logo/hospodar-yki-mark.svg")==2, html
        assert page.count('class="mode-entry ')==2, html
        assert "Вчитися" in page and "Пробний YKI" in page
        assert 'href="./exam.html"' in page
        assert 'href="./"' in page
        assert 'aria-current="page"' in page
        assert 'class="brand-mark" src="../brand/logo/hospodar-yki-mark.svg"' in page
        assert '<span class="brand-mark"' not in page
    css=text(CSS)
    assert ".mode-entry-exam" in css and ".mode-entry-learn" in css
    assert "--learn-tint" in css and "--exam-tint" in css
    assert "@media (max-width:560px)" in css
    assert "prefers-reduced-motion" in css
    assert 'gateway.hidden=Boolean(exam.session && !exam.session.finishedAt)' in text(ROOT/"app/exam.mjs")
    assert "recognition" in text(ROOT/"brand/recognition-strategy-v02.md")
    print("PASS: one shared mark, two functional mode links, logo SVG, source-aware brand tokens and accessible text pairs")

if __name__=="__main__":
    main()
