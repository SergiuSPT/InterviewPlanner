export default function RequestError({ error }) {
  if (!error) return null;
  const details = Object.values(error.response?.data?.errors || {}).flat();
  return (
    <div className="session-alert" role="alert">
      <p>{error.response?.data?.message || error.message || "Something went wrong. Please try again."}</p>
      {details.length > 0 && <ul>{details.map((message, index) => <li key={index}>{message}</li>)}</ul>}
    </div>
  );
}
