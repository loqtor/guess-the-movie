const DEFAULT_OPTIONS = { 
  method: 'GET',
  mode: 'cors',
  cache: 'default',
};

export const makeRequest = (url: string, options: any) => {
  const finalOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const request = new Request(url, finalOptions)
  return fetch(request)
    .then((res) => res.json());
}

export const generateRandomNumberFromRange = (max: number, min: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}