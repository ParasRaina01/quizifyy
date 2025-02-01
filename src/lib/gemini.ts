import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

export async function generate_quiz(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = true; // Always expect array output

  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou must output an array of objects in the following json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    if (list_input) {
      output_format_prompt += `\nGenerate an array of json, one json for each input element.`;
    }

    try {
      const prompt = system_prompt + output_format_prompt + error_msg;
      const result = await model.generateContent(prompt + "\n" + user_prompt.toString());
      const response = await result.response;
      let res = response.text().replace(/'/g, '"');
      
      // ensure that we don't replace away apostrophes in text
      res = res.replace(/(\w)"(\w)/g, "$1'$2");

      if (verbose) {
        console.log("System prompt:", prompt);
        console.log("\nUser prompt:", user_prompt);
        console.log("\nGemini response:", res);
      }

      try {
        let output: any = JSON.parse(res);

        // If output is not an array, wrap it in an array
        if (!Array.isArray(output)) {
          output = [output];
        }

        // check for each element in the output_list, the format is correctly adhered to
        for (let index = 0; index < output.length; index++) {
          for (const key in output_format) {
            // unable to ensure accuracy of dynamic output header, so skip it
            if (/<.*?>/.test(key)) {
              continue;
            }

            // if output field missing, raise an error
            if (!(key in output[index])) {
              throw new Error(`${key} not in json output`);
            }

            // check that one of the choices given for the list of words is an unknown
            if (Array.isArray(output_format[key])) {
              const choices = output_format[key] as string[];
              // ensure output is not a list
              if (Array.isArray(output[index][key])) {
                output[index][key] = output[index][key][0];
              }
            }
          }
        }

        return output;
      } catch (e) {
        error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
        console.log("An exception occurred:", e);
        console.log("Current invalid json format ", res);
      }
    } catch (e) {
      error_msg = `\n\nError generating content: ${e}`;
      console.log("An exception occurred:", e);
    }
  }

  return [];
} 