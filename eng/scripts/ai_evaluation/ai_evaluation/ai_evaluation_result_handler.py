import json
import math
import pathlib
from typing import Any, List

from tabulate import tabulate

weights: dict[str, float] = {
    "similarity_weight": 0.6,  # Similarity between expected and actual
    "groundedness_weight": 0.4,  # Staying grounded in guidelines
}

class AIEvaluationResultHandler:
    # def __init__(self, result: dict[str, Any]):
    #     self.result = result
        
    
    def calculate_overall_score(self, row: dict[str, Any], weights: dict[str, float]) -> float:
        """Calculate weighted score based on various metrics."""
        # calculate the overall score when there are multiple metrics.
        if ("outputs.similarity.similarity" not in row) or ( "outputs.groundedness.groundedness" not in row):
            return 0.0
        
        similarity = float(row["outputs.similarity.similarity"])
        groundedness = float(row["outputs.groundedness.groundedness"])
        if similarity == math.nan or groundedness == math.nan:
            return 0.0
        else:
            return similarity * weights["similarity_weight"] + groundedness * weights["groundedness_weight"]
    
    def record_run_result(self, evals_result: dict[str, Any], metrics: List[str]) -> list[dict[str, Any]]:
        run_result = []
        total_score = 0

        similarity_pass_rate = 0
        groundedness_pass_rate = 0
        for row in evals_result["rows"]:
            score = self.calculate_overall_score(row, weights)
            total_score += score

            if "outputs.similarity.similarity_result" in row and row["outputs.similarity.similarity_result"] == "pass":
                similarity_pass_rate += 1

            if "outputs.groundedness.groundedness_result" in row and row["outputs.groundedness.groundedness_result"] == "pass":
                groundedness_pass_rate += 1

            run_result.append(
                {
                    "testcase": row["inputs.testcase"],
                    "expected": row["inputs.ground_truth"],
                    "actual": row["inputs.response"],
                    "similarity": float(row["outputs.similarity.similarity"]) if "outputs.similarity.similarity" in row else -1,
                    "gpt_similarity": float(row["outputs.similarity.gpt_similarity"]) if "outputs.similarity.gpt_similarity" in row else -1,
                    "similarity_threshold": float(row["outputs.similarity.similarity_threshold"]) if "outputs.similarity.similarity_threshold" in row else 3,
                    "similarity_result": row["outputs.similarity.similarity_result"] if "outputs.similarity.similarity_result" in row else "N/A",
                    "groundedness": float(row["outputs.groundedness.groundedness"]) if "outputs.groundedness.groundedness" in row else -1,
                    "gpt_groundedness": float(row["outputs.groundedness.gpt_groundedness"]) if "outputs.groundedness.gpt_groundedness" in row else -1,
                    "groundedness_threshold": float(row["outputs.groundedness.groundedness_threshold"]) if "outputs.groundedness.groundedness_threshold" in row else 3,
                    "groundedness_result": row["outputs.groundedness.groundedness_result"] if "outputs.groundedness.groundedness_result" in row else "N/A",
                    "overall_score": score,
                }
            )

        if evals_result:
            average_score = total_score / len(evals_result["rows"])
        else:
            average_score = 0
        run_result.append({"average_score": average_score, "total_evals": len(evals_result["rows"]), "similarity_pass_rate": similarity_pass_rate, "groundedness_pass_rate": groundedness_pass_rate})
        return run_result
    
    @classmethod
    def format_terminal_diff(cls, new: float, old: float, format_str: str = ".1f", reverse: bool = False) -> str:
        """Format difference with ANSI colors for terminal output."""

        diff = new - old
        if diff > 0:
            if reverse:
                return f" (\033[31m+{diff:{format_str}}\033[0m)"  # Red
            return f" (\033[32m+{diff:{format_str}}\033[0m)"  # Green
        elif diff < 0:
            if reverse:
                return f" (\033[32m{diff:{format_str}}\033[0m)"  # Green
            return f" (\033[31m{diff:{format_str}}\033[0m)"  # Red
        return f" ({diff:{format_str}})"

    @classmethod
    def output_table(cls, baseline_results: dict[str, Any], eval_results: list[dict[str, Any]], file_name: str) -> None:
        headers = [
            "Test Case",
            "Similarity",
            "Similarity Result",
            "Groundedness",
            "Groundedness Result",
            "Score"
        ]
        terminal_rows = []

        similarity_pass_rate = eval_results[-1]['similarity_pass_rate']
        groundedness_pass_rate = eval_results[-1]['groundedness_pass_rate']

        for result in eval_results[:-1]:  # Skip summary object
            testcase = result["testcase"]
            score = result["overall_score"]
            sim = result["similarity"]
            sim_result = result["similarity_result"]

            groundedness = result['groundedness']
            groundedness_result = result['groundedness_result']
            
            terminal_row = [testcase]
            if testcase in baseline_results:
                base = baseline_results[testcase]
                values =[
                    f"{sim:.1f}{cls.format_terminal_diff(sim, base['similarity'])}",
                    f"{sim_result}",
                    f"{groundedness}{cls.format_terminal_diff(groundedness, base['groundedness'])}",
                    f"{groundedness_result}",
                    f"{score:.1f}{cls.format_terminal_diff(score, base['overall_score'])}",
                ]
            else:
                values = [
                    f"{sim:.1f}",
                    f"{sim_result}",
                    f"{groundedness}",
                    f"{groundedness_result}",
                    f"{score:.1f}"
                ]
            terminal_row.extend(values)
            terminal_rows.append(terminal_row)

        print("====================================================")
        print(f"\n\n✨ {file_name} results:\n")
        print(tabulate(terminal_rows, headers, tablefmt="simple"))
        if baseline_results:
            print(
                f"\n{file_name} average score: {eval_results[-1]['average_score']} {format_terminal_diff(eval_results[-1]['average_score'], baseline_results['average_score'])}",
                f" similarity: pass({similarity_pass_rate}) fail({len(eval_results)-1 - similarity_pass_rate})",
                f" groundedness: pass({groundedness_pass_rate}) fail({len(eval_results)-1 - groundedness_pass_rate})"
                "\n\n"
            )

    @classmethod
    def show_results(cls, all_results: dict[str, Any]) -> None:
        """Display results in a table format."""
        for name, test_results in all_results.items():
            baseline_results = {}
            baselineName = f"{name.split('_')[0]}-test.json"
            baseline_path = pathlib.Path(__file__).parent / "results" / baselineName

            if baseline_path.exists():
                with open(baseline_path, "r") as f:
                    baseline_data = json.load(f)
                    for result in baseline_data[:-1]:  # Skip summary
                        baseline_results[result["testcase"]] = result
                    baseline_results["average_score"] = baseline_data[-1]["average_score"]

            cls.output_table(baseline_results, test_results, name)