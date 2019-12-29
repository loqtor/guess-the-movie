export const extractTranscripts = (results: any) => {
  const transcripts = [];
  
  const totalResults = results.length;
  let resultsIndex = 0;

  while (resultsIndex < totalResults) {
    const result = results.item(resultsIndex);
    const totalAlternatives = result.length;
    let alternativesIndex = 0;

    while (alternativesIndex < totalAlternatives) {
      const alternative = result.item(0);

      transcripts.push(alternative.transcript);

      alternativesIndex++;
    }

    resultsIndex++;
  }

  return transcripts;
}