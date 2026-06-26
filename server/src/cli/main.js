#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import {Command} from "commander";
import { login } from "./commands/auth/login.js";

dotenv.config();

async function main(){
    console.log(
        chalk.cyan(
            figlet.textSync("PHOENIX CLI",{
            font:"Standard",
            horizontalLayout:"default"
        })
    )
)
    console.log(chalk.gray("A CLI based AI tool \n"))

    const program=new Command("PHOENIX")
    program.version("0.0.1")
    .description("PHOENIX XLI - A cli based AI tool")
    .addCommand(login)

    program.action(()=>{
        program.help();
    })

    program.parse()
}

main().catch((err)=>{
    console.log(chalk.red("error running orbital CLI:"),err)
    process.exit(1)
})