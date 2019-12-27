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

export const shuffleArray = (array: any[]) => {
  var j, x, i;

  for (i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = array[i];
    array[i] = array[j];
    array[j] = x;
  }

  return array;
};