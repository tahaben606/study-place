import React, { useEffect, useState } from "react";
import axios from "axios";


const MotivationalQuotesWidget = () => {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await axios.get("https://api.zenquotes.io/api/random");
        const data = response.data[0];
        setQuote(data.q);
        setAuthor(data.a);
      } catch (error) {
        console.error("Error fetching quote:", error);
      }
    };

    fetchQuote();
  }, []);

  return (
    <div className="motivational-quotes-widget">
      <h2>💬 Motivational Quote</h2>
      <div className="quote-container">
        <p className="quote">"{quote}"</p>
        <p className="author">- {author}</p>
      </div>
    </div>
  );
};

export default MotivationalQuotesWidget;
