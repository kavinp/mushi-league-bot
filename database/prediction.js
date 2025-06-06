import { db } from "./database.js";

export async function loadCumulativeTopTenInPredictions(season, week) {
  const topTenQuery =
    "SELECT predictor_snowflake, count(predictor_snowflake) AS correctPredictions FROM prediction \
     INNER JOIN pairing ON pairing = pairing.id \
     INNER JOIN matchup ON pairing.matchup = matchup.id \
     INNER JOIN week ON matchup.week = week.id \
     WHERE pairing.winner IS NOT NULL AND pairing.winner = predicted_winner AND pairing.game1 IS NOT NULL AND week.season = ? AND week.number <= ? \
     GROUP BY predictor_snowflake \
     ORDER BY correctPredictions DESC LIMIT 10";

  return await db.all(topTenQuery, season, week);
}

export async function loadWeeklyTopTenInPredictions(season, week) {
  const topTenQuery =
    "SELECT predictor_snowflake, count(predictor_snowflake) AS correctPredictions FROM prediction \
     INNER JOIN pairing ON pairing = pairing.id \
     INNER JOIN matchup ON pairing.matchup = matchup.id \
     INNER JOIN week ON matchup.week = week.id \
     WHERE pairing.winner IS NOT NULL AND pairing.winner = predicted_winner AND pairing.game1 IS NOT NULL AND week.season = ? AND week.number = ? \
     GROUP BY predictor_snowflake \
     ORDER BY correctPredictions DESC LIMIT 10";

  return await db.all(topTenQuery, season, week);
}

export async function loadPredictionsStandings(season) {
  const standingsQuery =
    "SELECT player.name, SUM(IIF(pairing.winner = prediction.predicted_winner, 1, 0)) AS correctPredictions, COUNT(prediction.predictor_snowflake) AS totalPredictions FROM prediction \
     INNER JOIN pairing ON prediction.pairing = pairing.id \
     INNER JOIN matchup ON pairing.matchup = matchup.id \
     INNER JOIN week ON matchup.week = week.id \
     LEFT JOIN player ON player.discord_snowflake = prediction.predictor_snowflake \
     WHERE pairing.game1 IS NOT NULL AND week.season = ? \
     GROUP BY prediction.predictor_snowflake \
     ORDER BY correctPredictions DESC, totalPredictions ASC";

  return await db.all(standingsQuery, season);
}

export async function savePredictionsToDatabase(
  pairingId,
  predictions,
  leftPlayer,
  rightPlayer
) {
  const leftPlayerPredictions = predictions[leftPlayer]
    .map((reacter) => `(${pairingId}, ${reacter}, ${leftPlayer})`)
    .join(",\n");
  const rightPlayerPredictions = predictions[rightPlayer]
    .map((reacter) => `(${pairingId}, ${reacter}, ${rightPlayer})`)
    .join(",\n");
  const separator =
    leftPlayerPredictions && rightPlayerPredictions ? ",\n" : "";

  const insertQuery =
    "INSERT INTO prediction (pairing, predictor_snowflake, predicted_winner) VALUES\n".concat(
      leftPlayerPredictions,
      separator,
      rightPlayerPredictions
    );

  await db.run(insertQuery);
}
