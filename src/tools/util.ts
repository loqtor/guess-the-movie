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