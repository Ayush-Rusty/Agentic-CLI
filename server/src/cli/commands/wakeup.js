import chalk from "chalk";
import {Command} from "commander";
import yoctoSpinner from "yocto-spinner";
import {getStoredToken} from "../auth/login.js"
import prisma from "../../../lib/db.js";
import {select} from "@clack/prompts";

const wakeUpAction=async()=>{
    const token=await getStoredToken();
    if(!token?.access_token){
        console.log(chalk.red("Not Authenticated. please login"))
    }
    const spinner=yoctoSpinner({text:"fetching the user information..."})
    spinner.start()

    const user=await prisma.user.findFirst({
        where:{
            sessions:{
                some:{
                    token:token.access_token
                }
            }
        },
        select:{
            id:true,
            name:true,
            email:true,
            image:true,
        }
    });
    spinner.stop();

    if(!user){
        console.log(chalk.red("User not found"));
        return;
    }

    console.log(chalk.green(`Welcome back ${user.name}`))

    const choice=await select({
        message:"select an Option",
        options:[
            {
                value:"chat",
                label:"chat",
                hint:"Simple chat with AI"
            },
            {
                value:"tool",
                label:"tool calling",
                hint:"chat with tools (Google Search, Code Execution)"
            },
            {
                value:"agent",
                label:"agentic Mode",
                hint:"advenced AI agent (comming soon)",

            }
        ]
    });

    switch(choice){
        case "chat":
            console.log("chat is selected")
            break;
        case "tool":
            console.log("tool is selected")
            break;
        case "agent":
            console.log("agent mode is selected")
            break;
    }
}

export const wakeUp=new Command("wakeup")
.description("wakeup the AI")
.action(wakeUpAction)

