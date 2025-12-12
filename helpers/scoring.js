export function getPollutionScore(pm25, no2) {
    if (typeof pm25 !== "number" || typeof no2 !== "number") {
        throw "Invalid pollutant values.";
    }

    let pmScore;
    if (pm25 <= 12) pmScore = "Safe";
    else if (pm25 <= 35.4) pmScore = "Moderate";
    else pmScore = "High-Risk";

    let no2Score;
    if (no2 <= 53) no2Score = "Safe";
    else if (no2 <= 100) no2Score = "Moderate";
    else no2Score = "High-Risk";

    //Final Score is the worse of the two
    const levels = ["Safe", "Moderate", "High-Risk"];
    const finalScore = levels[Math.max(levels.indexOf(pmScore), levels.indexOf(no2Score))];

    return {
        pm25: pmScore,
        no2: no2Score,
        overall: finalScore
    };
}
