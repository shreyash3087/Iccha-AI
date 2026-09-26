"""
Benchmark result aggregation and report generation.

Produces:
  1. Rich console table (printed during run)
  2. bench_results/YYYY-MM-DDTHH-MM-SS/report.md (Markdown, git-committable)
  3. bench_results/YYYY-MM-DDTHH-MM-SS/raw.json (raw data, for later re-analysis)

The Markdown report is the key deliverable — it documents:
  - Which providers were tested and skipped (and why)
  - Per-provider aggregate metrics (mean ± stddev)
  - Winner recommendation with rationale
  - Individual per-item results (collapsed by default in GitHub)
"""

from __future__ import annotations

import json
import logging
import math
import statistics
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from iccha.bench.llm import LLMResult
    from iccha.bench.stt import STTResult
    from iccha.bench.tts import TTSResult

logger = logging.getLogger(__name__)

RESULTS_BASE = Path(__file__).parent.parent.parent.parent.parent / "bench_results"


def _mean(vals: list[float]) -> float:
    return statistics.mean(vals) if vals else 0.0


def _stdev(vals: list[float]) -> float:
    return statistics.stdev(vals) if len(vals) > 1 else 0.0


def _p95(vals: list[float]) -> float:
    if not vals:
        return 0.0
    s = sorted(vals)
    idx = math.ceil(0.95 * len(s)) - 1
    return s[max(0, idx)]


# ── Aggregation helpers ───────────────────────────────────────────────────────

def _aggregate_stt(results: list["STTResult"]) -> dict:
    providers: dict[str, dict] = {}
    for r in results:
        p = providers.setdefault(r.provider, {"latencies": [], "wers": [], "cers": [], "errors": 0, "total": 0})
        p["total"] += 1
        if r.ok:
            p["latencies"].append(r.total_ms)
            p["wers"].append(r.wer)
            p["cers"].append(r.cer)
        else:
            p["errors"] += 1

    out = {}
    for pname, data in providers.items():
        lats = data["latencies"]
        wers = data["wers"]
        cers = data["cers"]
        skipped = any("not set" in str(r.error) for r in results if r.provider == pname and r.error)
        out[pname] = {
            "mean_latency_ms": _mean(lats),
            "p95_latency_ms": _p95(lats),
            "mean_wer": _mean(wers),
            "mean_cer": _mean(cers),
            "error_count": data["errors"],
            "total": data["total"],
            "skipped": skipped,
        }
    return out


def _aggregate_llm(results: list["LLMResult"]) -> dict:
    providers: dict[str, dict] = {}
    for r in results:
        p = providers.setdefault(r.provider, {
            "ttfts": [], "totals": [], "accuracies": [], "json_valid": 0, "errors": 0, "total": 0,
        })
        p["total"] += 1
        if r.ok:
            if r.ttft_ms > 0:
                p["ttfts"].append(r.ttft_ms)
            p["totals"].append(r.total_ms)
            p["accuracies"].append(r.field_accuracy)
            p["json_valid"] += 1
        else:
            p["errors"] += 1

    out = {}
    for pname, data in providers.items():
        skipped = any("not set" in str(r.error) for r in results if r.provider == pname and r.error)
        out[pname] = {
            "mean_ttft_ms": _mean(data["ttfts"]),
            "p95_ttft_ms": _p95(data["ttfts"]),
            "mean_total_ms": _mean(data["totals"]),
            "mean_accuracy": _mean(data["accuracies"]),
            "json_valid_rate": data["json_valid"] / data["total"] if data["total"] else 0,
            "error_count": data["errors"],
            "total": data["total"],
            "skipped": skipped,
        }
    return out


def _aggregate_tts(results: list["TTSResult"]) -> dict:
    providers: dict[str, dict] = {}
    for r in results:
        p = providers.setdefault(r.provider, {"ttfbs": [], "totals": [], "rtfs": [], "errors": 0, "total": 0})
        p["total"] += 1
        if r.ok:
            p["ttfbs"].append(r.ttfb_ms)
            p["totals"].append(r.total_ms)
            if r.rtf > 0:
                p["rtfs"].append(r.rtf)
        else:
            p["errors"] += 1

    out = {}
    for pname, data in providers.items():
        skipped = any("not set" in str(r.error) for r in results if r.provider == pname and r.error)
        out[pname] = {
            "mean_ttfb_ms": _mean(data["ttfbs"]),
            "p95_ttfb_ms": _p95(data["ttfbs"]),
            "mean_total_ms": _mean(data["totals"]),
            "mean_rtf": _mean(data["rtfs"]),
            "error_count": data["errors"],
            "total": data["total"],
            "skipped": skipped,
        }
    return out


# ── Console output ─────────────────────────────────────────────────────────────

def print_console_report(
    stt_results: list["STTResult"],
    llm_results: list["LLMResult"],
    tts_results: list["TTSResult"],
) -> None:
    try:
        from rich.console import Console
        from rich.table import Table
        from rich import box
        import sys
        # Force UTF-8 on Windows so Rich arrows/checkmarks don't crash cp1252
        console = Console(force_terminal=True, highlight=False,
                          file=open(sys.stdout.fileno(), mode='w', encoding='utf-8', closefd=False))
    except Exception:
        try:
            from rich.console import Console
            from rich.table import Table
            from rich import box
            console = Console()
        except ImportError:
            logger.warning("rich not installed -- skipping pretty console output")
            return

    stt_agg = _aggregate_stt(stt_results)
    llm_agg = _aggregate_llm(llm_results)
    tts_agg = _aggregate_tts(tts_results)

    console.rule("[bold cyan]ICCHA AI — Phase 2 Benchmark Results[/]")

    # STT table
    t = Table(title="STT Providers", box=box.ROUNDED, show_lines=True)
    t.add_column("Provider", style="bold")
    t.add_column("Mean Latency", justify="right")
    t.add_column("p95 Latency", justify="right")
    t.add_column("Mean WER (low=best)", justify="right")
    t.add_column("Mean CER (low=best)", justify="right")
    t.add_column("Status")
    for pname, d in stt_agg.items():
        if d["skipped"]:
            t.add_row(pname, "—", "—", "—", "—", "[yellow]SKIPPED (no API key)[/]")
        else:
            wer_color = "green" if d["mean_wer"] < 0.15 else ("yellow" if d["mean_wer"] < 0.30 else "red")
            t.add_row(
                pname,
                f"{d['mean_latency_ms']:.0f}ms",
                f"{d['p95_latency_ms']:.0f}ms",
                f"[{wer_color}]{d['mean_wer']:.3f}[/]",
                f"{d['mean_cer']:.3f}",
                f"[green]OK[/] ({d['total'] - d['error_count']}/{d['total']})",
            )
    console.print(t)

    # LLM table
    t2 = Table(title="LLM Providers", box=box.ROUNDED, show_lines=True)
    t2.add_column("Provider", style="bold")
    t2.add_column("Mean TTFT", justify="right")
    t2.add_column("p95 TTFT", justify="right")
    t2.add_column("Mean Total", justify="right")
    t2.add_column("Field Accuracy (hi=best)", justify="right")
    t2.add_column("JSON Valid %", justify="right")
    t2.add_column("Status")
    for pname, d in llm_agg.items():
        if d["skipped"]:
            t2.add_row(pname, "—", "—", "—", "—", "—", "[yellow]SKIPPED (no API key)[/]")
        else:
            acc_color = "green" if d["mean_accuracy"] > 0.8 else ("yellow" if d["mean_accuracy"] > 0.5 else "red")
            t2.add_row(
                pname,
                f"{d['mean_ttft_ms']:.0f}ms",
                f"{d['p95_ttft_ms']:.0f}ms",
                f"{d['mean_total_ms']:.0f}ms",
                f"[{acc_color}]{d['mean_accuracy']:.2f}[/]",
                f"{d['json_valid_rate']*100:.0f}%",
                "[green]OK[/]",
            )
    console.print(t2)

    # TTS table
    t3 = Table(title="TTS Providers", box=box.ROUNDED, show_lines=True)
    t3.add_column("Provider", style="bold")
    t3.add_column("Mean TTFB", justify="right")
    t3.add_column("p95 TTFB", justify="right")
    t3.add_column("Mean Total", justify="right")
    t3.add_column("Mean RTF lo=best", justify="right")
    t3.add_column("Status")
    for pname, d in tts_agg.items():
        if d["skipped"]:
            t3.add_row(pname, "—", "—", "—", "—", "[yellow]SKIPPED (no API key)[/]")
        else:
            rtf_color = "green" if d["mean_rtf"] < 0.3 else ("yellow" if d["mean_rtf"] < 0.6 else "red")
            t3.add_row(
                pname,
                f"{d['mean_ttfb_ms']:.0f}ms",
                f"{d['p95_ttfb_ms']:.0f}ms",
                f"{d['mean_total_ms']:.0f}ms",
                f"[{rtf_color}]{d['mean_rtf']:.3f}[/]",
                "[green]OK[/]",
            )
    console.print(t3)


# ── Markdown + JSON output ─────────────────────────────────────────────────────

def _winner(agg: dict, metric: str, lower_is_better: bool = True) -> str:
    """Return the provider name with the best score on a metric, skipping skipped entries."""
    candidates = {k: v for k, v in agg.items() if not v.get("skipped") and v.get(metric, 0) > 0}
    if not candidates:
        return "N/A"
    return min(candidates, key=lambda k: candidates[k][metric]) if lower_is_better \
        else max(candidates, key=lambda k: candidates[k][metric])


def save_report(
    stt_results: list["STTResult"],
    llm_results: list["LLMResult"],
    tts_results: list["TTSResult"],
) -> Path:
    run_ts = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    run_dir = RESULTS_BASE / run_ts
    run_dir.mkdir(parents=True, exist_ok=True)

    stt_agg = _aggregate_stt(stt_results)
    llm_agg = _aggregate_llm(llm_results)
    tts_agg = _aggregate_tts(tts_results)

    stt_winner = _winner(stt_agg, "mean_wer", lower_is_better=True)
    llm_winner_speed = _winner(llm_agg, "mean_ttft_ms", lower_is_better=True)
    llm_winner_acc = _winner(llm_agg, "mean_accuracy", lower_is_better=False)
    tts_winner = _winner(tts_agg, "mean_ttfb_ms", lower_is_better=True)

    # ── Save raw JSON ─────────────────────────────────────────────────────────
    raw_path = run_dir / "raw.json"

    def _ser(obj):
        if hasattr(obj, "__dict__"):
            return obj.__dict__
        return str(obj)

    raw_path.write_text(
        json.dumps({
            "run_timestamp": run_ts,
            "stt": [r.__dict__ for r in stt_results],
            "llm": [r.__dict__ for r in llm_results],
            "tts": [r.__dict__ for r in tts_results],
            "aggregates": {
                "stt": stt_agg,
                "llm": llm_agg,
                "tts": tts_agg,
            },
        }, default=_ser, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    logger.info("Raw results saved: %s", raw_path)

    # ── Build Markdown report ─────────────────────────────────────────────────
    lines: list[str] = [
        f"# ICCHA AI — Phase 2 Benchmark Report",
        f"",
        f"**Run timestamp:** `{run_ts}`  ",
        f"**Corpus:** {len(stt_results) // max(len(stt_agg), 1)} audio items × {len(stt_agg)} STT providers  ",
        f"**LLM test cases:** {len(llm_results) // max(len(llm_agg), 1)} × {len(llm_agg)} providers  ",
        f"**TTS phrases:** {len(tts_results) // max(len(tts_agg), 1)} × {len(tts_agg)} providers  ",
        f"",
        f"---",
        f"",
        f"## 🏆 Winners at a Glance",
        f"",
        f"| Component | Winner | Metric |",
        f"|-----------|--------|--------|",
        f"| STT (accuracy) | **{stt_winner}** | Lowest mean WER |",
        f"| LLM (speed) | **{llm_winner_speed}** | Lowest mean TTFT |",
        f"| LLM (accuracy) | **{llm_winner_acc}** | Highest field accuracy |",
        f"| TTS (speed) | **{tts_winner}** | Lowest mean TTFB |",
        f"",
        f"> Audio samples for TTS are in `bench_results/{run_ts}/` — listen manually to judge pronunciation quality.",
        f"",
        f"---",
        f"",
        f"## STT Results",
        f"",
        f"| Provider | Mean Latency | p95 Latency | Mean WER ↓ | Mean CER ↓ | Success |",
        f"|----------|-------------|-------------|------------|------------|---------|",
    ]

    for pname, d in stt_agg.items():
        if d["skipped"]:
            lines.append(f"| {pname} | — | — | — | — | ⏭ SKIPPED (no API key) |")
        else:
            ok_count = d["total"] - d["error_count"]
            lines.append(
                f"| {pname} | {d['mean_latency_ms']:.0f}ms | {d['p95_latency_ms']:.0f}ms "
                f"| {d['mean_wer']:.3f} | {d['mean_cer']:.3f} | {ok_count}/{d['total']} |"
            )

    lines += [
        f"",
        f"---",
        f"",
        f"## LLM Results",
        f"",
        f"| Provider | Mean TTFT | p95 TTFT | Mean Total | Field Accuracy ↑ | JSON Valid % |",
        f"|----------|-----------|----------|------------|-----------------|--------------|",
    ]

    for pname, d in llm_agg.items():
        if d["skipped"]:
            lines.append(f"| {pname} | — | — | — | — | — |")
        else:
            lines.append(
                f"| {pname} | {d['mean_ttft_ms']:.0f}ms | {d['p95_ttft_ms']:.0f}ms "
                f"| {d['mean_total_ms']:.0f}ms | {d['mean_accuracy']:.2f} | {d['json_valid_rate']*100:.0f}% |"
            )

    lines += [
        f"",
        f"---",
        f"",
        f"## TTS Results",
        f"",
        f"| Provider | Mean TTFB | p95 TTFB | Mean Total | Mean RTF ↓ | Audio Files |",
        f"|----------|-----------|----------|------------|------------|-------------|",
    ]

    for pname, d in tts_agg.items():
        if d["skipped"]:
            lines.append(f"| {pname} | — | — | — | — | ⏭ SKIPPED |")
        else:
            lines.append(
                f"| {pname} | {d['mean_ttfb_ms']:.0f}ms | {d['p95_ttfb_ms']:.0f}ms "
                f"| {d['mean_total_ms']:.0f}ms | {d['mean_rtf']:.3f} | "
                f"[Listen](tts_samples/) |"
            )

    lines += [
        f"",
        f"---",
        f"",
        f"## Recommendation",
        f"",
        f"> **Fill this in after listening to TTS audio samples.**",
        f">",
        f"> Based on automated metrics:",
        f"> - **STT:** {stt_winner} showed best WER. Confirm on edge cases.",
        f"> - **LLM:** {llm_winner_acc} showed best field accuracy. {llm_winner_speed} was fastest.",
        f"> - **TTS:** {tts_winner} had lowest TTFB. Listen to samples to judge Hindi pronunciation.",
        f"",
        f"---",
        f"",
        f"*Generated by `iccha.bench` — ICCHA AI Phase 2 benchmarking framework*",
    ]

    report_path = run_dir / "report.md"
    report_path.write_text("\n".join(lines), encoding="utf-8")
    logger.info("Markdown report saved: %s", report_path)

    return report_path
