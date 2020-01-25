import { AnnyangCommands, Command } from "../pages/Game";

export const formatForAnnyang = (commands: { [keyof: string]: Command }) => {
  const annyangFormattedCommands: AnnyangCommands = {};

  Object.keys(commands).forEach((commandKey: any) => {
    const { phrases } = commands[commandKey];

    phrases.forEach((phrase: string) => {
      annyangFormattedCommands[phrase] = commands[commandKey].callback;
    });
  });

  return annyangFormattedCommands;
}