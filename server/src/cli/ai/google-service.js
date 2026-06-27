import {google} from "@ai-sdk/google"
import {streamText} from "ai"
import {config} from "../../config/google.config.js"
import chalk from "chalk"

export class AIService{
    constructor(){
        if(!config.googleApiKey){
            throw new Error("Google api key is not set in the env")
        }

        this.model=google(config.model,{
            apikey:config.googleApiKey,
        })
    }

    async sendMessage(messages,onChunk,tools=undefined,onToolCall=null){
        try {
            const streamConfig={
                model:this.model,
                messages:messages,
                temperature:config.temperature,

            }

            const result=streamText(streamConfig);
            let fullResponse=""

            for await (const chunk of result.textStream){
                fullResponse +=chunk;
                if(onChunk){
                    onChunk(chunk)
                }
            }

            const fullResult=result
            return {
                content:fullResponse,
                finishResponse:fullResult.finishReason,
                usage:fullResult.usage
            }
        } catch (error) {
            console.log(chalk.red("AI Service Error:"),error.message);
            throw error
        }
    }

    async getMessage(message,tools=undefined){
        let fullResponse="";
        await this.sendMessage(messages,(chunk)=>{
            fullResponse+=chunk
        })
        return fullResponse;
    }
}