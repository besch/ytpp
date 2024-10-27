const API_BASE_URL = process.env.REACT_APP_BASE_API_URL;

export const fetchMovies = async (params: {
  text: string;
  url: string;
}): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/search-movies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.Search;
};
