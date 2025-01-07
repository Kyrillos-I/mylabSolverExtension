// Store your OpenAI API key securely
const OPENAI_API_KEY =
  "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";
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendData") {
    // Forward the data to the popup
    chrome.runtime.sendMessage({ action: "updatePopup", data: request.data });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processQuestion") {
    const question = message.question;
    const answerPart = message.answerPart;
    console.log("Received question:", question);
    console.log("Received question 2:", answerPart);
    // Call the OpenAI API
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content:
              question +
              "answer only this part of the question: format your answer so that at the end of it you write 'Final Answer: [answer]' obviously replacing the brackets with the actual final answer (when writing a symbol in the [answer] for which their is nothing on the keyboard like pi use Pearson's Math Expressions keyboard shortcuts, also do NOT use \\fract just use a /) Here are the pearson shortcuts: Keyboard Inputs for Mathematical Symbols Subscript: y_3 Exponent: 10^2<esc> Fraction: a/b<esc> Decimal Point: 2.56 Parentheses: ( ) Square Brackets: [ ] Curly Braces: { } Addition: + Subtraction: - (minus sign or hyphen) Multiplication Dot: * (asterisk) Square Root: \\sqrt{}<esc> Nth Root: \\nrt[n]{}<esc> Absolute Value: |x| Vector: \\vec{x} Unit Vector: \\hat{x} Greek Letter Symbols α: \\alpha β: \\beta γ: \\gamma Δ: \\Delta, δ: \\delta ϵ: \\epsilon η: \\eta θ: \\theta κ: \\kappa λ: \\lambda μ: \\mu ν: \\nu π: \\pi ρ: \\rho Σ: \\Sigma, σ: \\sigma τ: \\tau ϕ: \\phi χ: \\chi Ψ: \\Psi, ψ: \\psi Ω: \\Omega, ω: \\omega Constants and Symbols Euler's Number: e Local Gravity: g Pi: \\pi Electromotive Force (EMF): \\EMF Reduced Planck's Constant: \\hbar Trigonometric and Special Functions Sine: sin(x) Cosine: cos(x) Tangent: tan(x) Cotangent: cot(x) Secant: sec(x) Cosecant: csc(x) Arcsine: asin(x) or sin^-1(x) Arccosine: acos(x) or cos^-1(x) Arctangent: atan(x) or tan^-1(x) Arccotangent: acot(x) or cot^-1(x) Arcsecant: asec(x) or sec^-1(x) Arccosecant: ascs(x) or csc^-1(x) Natural Exponential Function: e^x or exp(x) Natural Logarithm: ln(x) Logarithm (Base 10): log(x)" +
              "(remember to escape exponents, fraction denominators, and square roots, by writing <esc> after them.  Do not omit or alter the <esc> tags. Write them out exactly as shown. For Example if the final answer is pi/2 + 3, I want you to write Final Answer: pi/2<esc> + 3 if the final answer is sqrt{3} + i write sqrt{3}<esc> + i if the final answer is 10^3 + 5 write 10^3<esc> + 5)(in the event that the question is a Multiple Choice or Select All That Apply With Check Boxes write 'MC: Final Answer: [answer]', with the answer being just the Capital letter, if their are multiple answers just write the answer with spaces like 'A B D') also do not format the final answer in markdown, you can format all the other math in markdown but the final answer should be in normal text, something a human can type out (in the case of this part of the question having multiple parts as in 'part 1' or 'part 2' answer only the LAST part in your final answer, do not answer anything thats already answered, write your answer as it should appean in the input, if it does not have multiple parts in this part, just answer this one)" +
              answerPart,
          },
        ],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.choices && data.choices.length > 0) {
          const answer = data.choices[0].message.content.trim();
          console.log("Received answer:", answer);
          sendResponse({ answer: answer });
        } else {
          console.error("No choices in response:", data);
          sendResponse({ error: "No answer received from OpenAI" });
        }
      })
      .catch((error) => {
        console.error("Error calling OpenAI API:", error);
        sendResponse({ error: "Error calling OpenAI API" });
      });

    // Return true to indicate asynchronous response
    return true;
  }
});
