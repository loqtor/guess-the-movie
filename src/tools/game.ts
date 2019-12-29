export const detectCommand = (commandList: string[], transcripts: string[]) => {
  console.log('transcripts at detectCommand: ', transcripts);
  const mentionedCommand = commandList.find((command: string) => {
    const commandFound = transcripts.indexOf(command) !== -1;

    console.log('commandFound: ', commandFound)

    return commandFound;
  });

  return !!mentionedCommand;
}