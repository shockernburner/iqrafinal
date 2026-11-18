"""Builds the IQRA 3-month app-store launch budget workbook (all costs formula-driven)."""
import sys
from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = sys.argv[1]
F = "Arial"
BLUE = Font(name=F, color="0000FF")
BLACK = Font(name=F)
GREEN = Font(name=F, color="008000")
BOLD = Font(name=F, bold=True)
TITLE = Font(name=F, bold=True, size=14)
HEAD = Font(name=F, bold=True, color="FFFFFF")
HEAD_FILL = PatternFill("solid", fgColor="103D2B")
INPUT_FILL = PatternFill("solid", fgColor="FFFF00")
SUB_FILL = PatternFill("solid", fgColor="EEF2EE")
THIN = Side(style="thin", color="BBBBBB")
BOX = Border(top=THIN, bottom=THIN, left=THIN, right=THIN)
USD = '$#,##0;($#,##0);"-"'
USD2 = '$#,##0.00;($#,##0.00);"-"'
USD4 = '$#,##0.0000;($#,##0.0000);"-"'
INT = '#,##0;(#,##0);"-"'
DEC1 = '#,##0.0;(#,##0.0);"-"'
PCT = '0.0%;(0.0%);"-"'

wb = Workbook()

# ---------------------------------------------------------------- Inputs
ws = wb.active
ws.title = "Inputs"
ws["A1"] = "IQRA — 3-month app-store launch budget: inputs"; ws["A1"].font = TITLE
ws["A2"] = "Edit only the yellow cells (blue text). Everything on the Budget and Model comparison tabs recalculates."
ws["A2"].font = Font(name=F, italic=True)

def head(row, labels):
    for i, label in enumerate(labels):
        c = ws.cell(row=row, column=1 + i, value=label)
        c.font, c.fill, c.border = HEAD, HEAD_FILL, BOX

def inp(cell, value, fmt, note=None):
    c = ws[cell]
    c.value, c.font, c.fill, c.number_format, c.border = value, BLUE, INPUT_FILL, fmt, BOX
    if note:
        c.comment = Comment(note, "IQRA budget")

def label(row, text, unit=None, source=None):
    ws.cell(row=row, column=1, value=text).font = BLACK
    if unit is not None:
        ws.cell(row=row, column=2, value=unit).font = Font(name=F, color="666666")
    if source:
        s = ws.cell(row=row, column=6, value=source)
        s.font = Font(name=F, size=9, color="666666")

# Traffic per month
head(4, ["Traffic", "Unit", "Month 1", "Month 2", "Month 3", "Basis / source"])
label(5, "Users", "users", "Given by the user (1,000 / 2,000 / 4,000). Change these to model growth. Meaning is set in row 7.")
inp("C5", 1000, INT); inp("D5", 2000, INT); inp("E5", 4000, INT)
label(6, "Reserved VM for the app server", "$/month",
      "Replit Reserved VM: Dedicated 2 vCPU/8 GB $50, 4 vCPU/16 GB $130, 8 vCPU/32 GB ~$264 (docs.replit.com/billing/deployment-pricing, Aug 2026 rates).")
inp("C6", 50, USD); inp("D6", 130, USD); inp("E6", 130, USD)

label(7, "What the user numbers mean", None,
      "'Concurrent at peak' = people using the app at the same moment (as requested). 'Monthly active users' = distinct people per month — roughly 50x cheaper.")
inp("C7", "Concurrent at peak", "@")
dv_mode = DataValidation(type="list", formula1='"Concurrent at peak,Monthly active users"', allow_blank=False)
ws.add_data_validation(dv_mode); dv_mode.add("C7")

# Usage behaviour
head(8, ["Usage behaviour", "Unit", "Value", "", "", "Basis / source"])
label(9, "Average concurrency as % of peak", "%", "Assumption: daily traffic averages ~35% of its peak hour. Raise if usage is flat across the day.")
inp("C9", 0.35, PCT, "Assumption. Peak concurrent users only happen at busy hours; over 24h the average is lower.")
label(10, "Questions per active user per hour", "questions", "Assumption: one question every ~10 minutes while a user has the app open.")
inp("C10", 6, DEC1, "Assumption. Biggest cost driver after the model — a daily question cap per user is the main lever.")
label(11, "Hours per month", "hours", "Billing convention (365 × 24 / 12).")
inp("C11", 730, INT)
label(12, "Questions per monthly active user per month", "questions", "Used only when row 7 = 'Monthly active users'. Assumption: ~1 question a day.")
inp("C12", 30, INT)

# Tokens per answer
head(13, ["Tokens per answer (from the code)", "Unit", "Value", "", "", "Basis / source"])
label(14, "Input tokens per question", "tokens",
      "Measured from code: system prompt 6,070 chars + 6 knowledge chunks × 2,600 chars + 3 example Q&As + question ≈ 7,500 tokens (more for Arabic/Bengali).")
inp("C14", 7500, INT)
label(15, "Output tokens per answer", "tokens", "Assumption: structured answer (direct answer, framework, sources) ≈ 800 tokens.")
inp("C15", 800, INT)

# Model selection
head(17, ["Claude model", "Input $/1M tokens", "Output $/1M tokens", "", "", "Basis / source"])
models = [
    ("Claude Sonnet 4.6 (current)", 3, 15, "Model the app uses today (iqra-llm.ts). Anthropic list price; Replit AI Integrations bills at public API prices."),
    ("Claude Sonnet 5.5", 2, 10, "Current Sonnet: newer and ~33% cheaper than 4.6. Anthropic list price (Nov 2026)."),
    ("Claude Haiku 5.5", 0.10, 0.50, "Cheapest current model; quality on nuanced guidance must be tested first. Anthropic list price, prompts ≤100K tokens."),
]
for i, (name, pin, pout, src) in enumerate(models):
    r = 18 + i
    ws.cell(row=r, column=1, value=name).font = BLACK
    inp(f"B{r}", pin, USD2); inp(f"C{r}", pout, USD2)
    ws.cell(row=r, column=6, value=src).font = Font(name=F, size=9, color="666666")
label(22, "Selected model for the Budget tab", None, "Pick from the list. The Model comparison tab shows all three side by side.")
inp("C22", models[0][0], "@")
dv = DataValidation(type="list", formula1="=$A$18:$A$20", allow_blank=False)
ws.add_data_validation(dv); dv.add("C22")

# Fixed and platform costs
head(24, ["Platform & fixed costs", "Unit", "Value", "", "", "Basis / source"])
fixed = [
    (25, "Apple Developer Program", "$/year", 99, USD, "Apple, $99/year; paid in month 1."),
    (26, "Google Play developer registration", "one-time", 25, USD, "Google Play Console, one-time $25; paid in month 1."),
    (27, "Replit Core plan", "$/month", 20, USD, "replit.com/pricing (monthly; $18 billed annually). Needed for Replit AI Integrations. Included credits ignored (conservative)."),
    (28, "Database compute hours", "hours/month", 730, INT, "Always-on under steady traffic. Replit production Postgres bills per compute hour."),
    (29, "Database compute rate", "$/hour", 0.16, USD2, "docs.replit.com/billing/aug-cloud-billing-updates (unchanged Aug 2026)."),
    (30, "Database storage", "GiB", 6, DEC1, "~0.5 GB today + ~5.5 GB after the planned 60 GB knowledge import (see docs/knowledge-upload-60gb-plan.md)."),
    (31, "Database storage rate", "$/GiB/month", 0.35, USD2, "docs.replit.com/billing/aug-cloud-billing-updates (new price from Aug 2026)."),
    (32, "Data sent per question (page + answer)", "KB", 20, INT, "Assumption: JSON answer plus app assets after caching."),
    (33, "Outbound data transfer rate", "$/GiB", 0.05, USD2, "docs.replit.com/billing/aug-cloud-billing-updates."),
    (34, "Transactional email (Resend Pro)", "$/month", 20, USD, "Verify on resend.com/pricing: free tier is 3,000 emails/month; Pro ~$20 for 50,000. Welcome + reset emails grow with sign-ups."),
    (35, "Mobile app wrappers & builds", "$/month", 0, USD,
     "Android: Trusted Web Activity (Bubblewrap, free). iOS: Capacitor (free), built on your own Mac with Xcode. $0 if built in-house."),
    (36, "Contingency", "% of subtotal", 0.10, PCT, "Buffer for retries, spikes and price changes."),
]
for r, text, unit, val, fmt, src in fixed:
    label(r, text, unit, src)
    inp(f"C{r}", val, fmt)

ws.column_dimensions["A"].width = 40
ws.column_dimensions["B"].width = 18
for col in "CDE":
    ws.column_dimensions[col].width = 14
ws.column_dimensions["F"].width = 100
ws.freeze_panes = "A4"

# ---------------------------------------------------------------- Budget
b = wb.create_sheet("Budget")
b["A1"] = "IQRA — 3-month budget (USD)"; b["A1"].font = TITLE
b["A2"] = '="AI model: "&Inputs!$C$22&"   ·   Edit assumptions on the Inputs tab"'
b["A2"].font = Font(name=F, italic=True, color="008000")
hdr = ["Line item", "Month 1", "Month 2", "Month 3", "3-month total", "How it's calculated"]
for i, h in enumerate(hdr):
    c = b.cell(row=4, column=1 + i, value=h); c.font, c.fill, c.border = HEAD, HEAD_FILL, BOX
months = {"B": "C", "C": "D", "D": "E"}  # Budget column -> Inputs column

def row(r, text, formulas, fmt, how, total=True, bold=False, fill=None, font=None):
    b.cell(row=r, column=1, value=text).font = BOLD if bold else BLACK
    for col, f in formulas.items():
        c = b[f"{col}{r}"]
        c.value, c.number_format, c.border = f, fmt, BOX
        c.font = font or (BOLD if bold else BLACK)
        if fill: c.fill = fill
    if total:
        c = b[f"E{r}"]; c.value, c.number_format, c.border = f"=SUM(B{r}:D{r})", fmt, BOX
        c.font = BOLD if bold else BLACK
        if fill: c.fill = fill
    b.cell(row=r, column=6, value=how).font = Font(name=F, size=9, color="666666")

# Traffic
b["A5"] = "Traffic"; b["A5"].font = BOLD
row(6, "Users (meaning set on Inputs row 7)", {k: f"=Inputs!{v}5" for k, v in months.items()}, INT, "From Inputs.", total=False, font=GREEN)
row(7, "Questions answered", {k: f'=IF(Inputs!$C$7="Monthly active users",Inputs!{v}5*Inputs!$C$12,Inputs!{v}5*Inputs!$C$9*Inputs!$C$11*Inputs!$C$10)' for k, v in months.items()}, INT,
    "Concurrent: users × average-% × hours × questions per user-hour.  Monthly active: users × questions per user per month.")
row(8, "Questions per second at peak (concurrent mode)", {k: f'=IF(Inputs!$C$7="Monthly active users",0,Inputs!{v}5*Inputs!$C$10/3600)' for k, v in months.items()}, DEC1,
    "For sizing: peak users × questions per hour ÷ 3,600 (shown only in concurrent mode).", total=False)
row(9, "AI cost per question", {k: "=(Inputs!$C$14*INDEX(Inputs!$B$18:$B$20,MATCH(Inputs!$C$22,Inputs!$A$18:$A$20,0))+Inputs!$C$15*INDEX(Inputs!$C$18:$C$20,MATCH(Inputs!$C$22,Inputs!$A$18:$A$20,0)))/1000000" for k in months},
    USD4, "(input tokens × input price + output tokens × output price) ÷ 1,000,000 for the selected model.", total=False)

# Costs
b["A11"] = "Costs"; b["A11"].font = BOLD
row(12, "AI answers (Claude via Replit AI Integrations)", {k: f"={k}7*{k}9" for k in months}, USD, "Questions × AI cost per question.")
row(13, "App server (Replit Reserved VM)", {k: f"=Inputs!{v}6" for k, v in months.items()}, USD, "Monthly VM price from Inputs.")
row(14, "Database compute", {k: "=Inputs!$C$28*Inputs!$C$29" for k in months}, USD, "Hours × $/hour.")
row(15, "Database storage", {k: "=Inputs!$C$30*Inputs!$C$31" for k in months}, USD, "GiB × $/GiB.")
row(16, "Outbound data transfer", {k: f"={k}7*Inputs!$C$32/1048576*Inputs!$C$33" for k in months}, USD, "Questions × KB ÷ 1,048,576 (KB→GiB) × $/GiB.")
row(17, "Replit Core plan", {k: "=Inputs!$C$27" for k in months}, USD, "Monthly plan.")
row(18, "Transactional email", {k: "=Inputs!$C$34" for k in months}, USD, "Monthly plan.")
row(19, "Apple Developer Program", {"B": "=Inputs!$C$25", "C": "=0", "D": "=0"}, USD, "Annual fee, paid once in month 1.")
row(20, "Google Play registration", {"B": "=Inputs!$C$26", "C": "=0", "D": "=0"}, USD, "One-time fee, month 1.")
row(21, "Mobile wrappers & builds", {k: "=Inputs!$C$35" for k in months}, USD, "In-house builds: $0.")
row(22, "Subtotal", {k: f"=SUM({k}12:{k}21)" for k in months}, USD, "", bold=True, fill=SUB_FILL)
row(23, "Contingency", {k: f"={k}22*Inputs!$C$36" for k in months}, USD, "Subtotal × contingency %.")
row(24, "TOTAL", {k: f"={k}22+{k}23" for k in months}, USD, "", bold=True, fill=SUB_FILL)
row(25, "Cumulative", {"B": "=B24", "C": "=B25+C24", "D": "=C25+D24"}, USD, "Running total.", total=False)
row(27, "AI share of total", {k: f"=IF({k}24=0,0,{k}12*(1+Inputs!$C$36)/{k}24)" for k in months}, PCT,
    "Shows what drives the budget.", total=False)
row(28, "Cost per user", {k: f"=IF({k}6=0,0,{k}24/{k}6)" for k in months}, USD2, "Total ÷ peak concurrent users.", total=False)
b["E27"] = "=IF(E24=0,0,E12*(1+Inputs!$C$36)/E24)"; b["E27"].number_format = PCT; b["E27"].border = BOX; b["E27"].font = BLACK
b.column_dimensions["A"].width = 44
for col in "BCDE":
    b.column_dimensions[col].width = 15
b.column_dimensions["F"].width = 70
b.freeze_panes = "B5"

# ---------------------------------------------------------------- Model comparison
m = wb.create_sheet("Model comparison")
m["A1"] = "Same traffic, different Claude model (USD)"; m["A1"].font = TITLE
m["A2"] = "AI cost depends only on the model and the Inputs; everything else is identical across rows."
m["A2"].font = Font(name=F, italic=True)
for i, h in enumerate(["Model", "Cost per question", "AI cost month 1", "AI cost month 2", "AI cost month 3",
                       "3-month AI cost", "3-month TOTAL (incl. platform + contingency)"]):
    c = m.cell(row=4, column=1 + i, value=h); c.font, c.fill, c.border = HEAD, HEAD_FILL, BOX
for i in range(3):
    r, ir = 5 + i, 18 + i
    m[f"A{r}"] = f"=Inputs!A{ir}"; m[f"A{r}"].font = GREEN
    m[f"B{r}"] = f"=(Inputs!$C$14*Inputs!B{ir}+Inputs!$C$15*Inputs!C{ir})/1000000"; m[f"B{r}"].number_format = USD4
    for j, col in enumerate("CDE"):
        m[f"{col}{r}"] = f"=Budget!{'BCD'[j]}$7*$B{r}"; m[f"{col}{r}"].number_format = USD
    m[f"F{r}"] = f"=SUM(C{r}:E{r})"; m[f"F{r}"].number_format = USD
    m[f"G{r}"] = f"=(F{r}+SUM(Budget!$E$13:$E$21))*(1+Inputs!$C$36)"; m[f"G{r}"].number_format = USD
    for col in "ABCDEFG":
        m[f"{col}{r}"].border = BOX
        if col != "A": m[f"{col}{r}"].font = BLACK
m.column_dimensions["A"].width = 32
for col in "BCDEF":
    m.column_dimensions[col].width = 17
m.column_dimensions["G"].width = 40

# ---------------------------------------------------------------- Notes
n = wb.create_sheet("Notes & Sources")
n["A1"] = "Notes, scope and sources"; n["A1"].font = TITLE
notes = [
    ("What \"bare minimum\" includes", "Store accounts, hosting, database, email and AI answers. Excludes marketing, salaries, paid design, app-store ads, OCR of scanned books, and taxes/VAT."),
    ("Mobile apps", "The app is already an installable web app (PWA). Android: wrap it with a Trusted Web Activity (Bubblewrap) — free. iOS: wrap with Capacitor and build in Xcode on your Mac — free. Apple can reject apps that are only a website in a wrapper (App Review guideline 4.2): add native value (e.g. push notifications, offline saved answers) before submitting."),
    ("Payments inside the apps", "If donations are taken inside the iOS/Android apps, Apple/Google rules apply. Donations to registered nonprofits may use an external link; otherwise in-app purchase fees (15–30%) apply. Not included."),
    ("Biggest lever", "AI answers are almost all of the cost and scale with questions answered. Levers: switch to Claude Sonnet 5.5 (~33% cheaper than 4.6 per token), cap free questions per user per day, cache repeated questions, or test Claude Haiku 5.5 for simple questions."),
    ("Concurrent users", "Here 'concurrent' means people using the app at the same moment at peak. If your 1,000/2,000/4,000 are actually monthly active users, set 'Average concurrency' and 'Questions per hour' much lower — costs fall proportionally."),
    ("Server size", "At 4,000 concurrent users and 6 questions/hour the app handles ~7 questions/second at peak; the server mostly waits on the AI, so a 4 vCPU Reserved VM is a reasonable start. Apply the search fix in docs/knowledge-upload-60gb-plan.md first, or database search becomes the bottleneck."),
    ("Source: Anthropic model prices", "Anthropic API list prices, Nov 2026: Sonnet 4.6 $3/$15, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50 per million input/output tokens. Replit AI Integrations bill at public API prices: https://docs.replit.com/features/integrations/replit-ai-integrations"),
    ("Source: Replit deployment", "https://docs.replit.com/billing/deployment-pricing"),
    ("Source: Replit database, storage, transfer", "https://docs.replit.com/billing/aug-cloud-billing-updates ; 100 GiB per production database: https://docs.replit.com/billing/about-usage-based-billing"),
    ("Source: Replit plans", "https://replit.com/pricing"),
    ("Source: store fees", "Apple Developer Program $99/year; Google Play Console $25 one-time (both unchanged in 2026)."),
    ("Prepared", "18 Nov 2026. Prices change — re-check the sources before committing spend."),
]
for i, (k, v) in enumerate(notes):
    r = 3 + i
    n[f"A{r}"] = k; n[f"A{r}"].font = BOLD; n[f"A{r}"].alignment = Alignment(vertical="top")
    n[f"B{r}"] = v; n[f"B{r}"].font = BLACK; n[f"B{r}"].alignment = Alignment(wrap_text=True, vertical="top")
n.column_dimensions["A"].width = 34
n.column_dimensions["B"].width = 120

for sheet in wb.worksheets:
    for r in sheet.iter_rows():
        for c in r:
            if c.font is None or c.font.name != F:
                c.font = Font(name=F, bold=c.font.bold if c.font else False, italic=c.font.italic if c.font else False,
                              color=c.font.color if c.font else None, size=c.font.size if c.font else 11)
from openpyxl.workbook.properties import CalcProperties
wb.calculation = CalcProperties(fullCalcOnLoad=True)
wb.active = 1
wb.save(OUT)
print("saved", OUT)
