import {cancel,confirm,intro,isCancel,outro} from "@clack/prompts";
import {logger} from "better-auth"
import {createAuthClient} from "better-auth/client"
import {deviceAuthorizationClient} from "better-auth/client/plugins"

import chalk from "chalk";
import {Command} from "commander";
import fs from "node:fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";
import prisma from "../../../lib/db.js"


dotenv.config();

const URL="http://localhost:3005"
const CLIENT_ID=process.env.GITHUB_CLIENT_ID;
const CONFIG_DIR=path.join(os.homedir(),".better-auth");
const TOKEN_FILE=path.join(CONFIG_DIR,"token.json");

export async function loginAction(opts){
    const options=z.object({
        serverUrl:z.string().optional(),
        clientId:z.string().optional()
    })

    const serverUrl=opts.serverUrl || URL;
    const clientId=opts.clientId || CLIENT_ID

    intro(chalk.bold("Better Auth CLI login"))

    const existingToken=false;
    const expired=false;

    if(existingToken && !expired){
        const shouldReAuth=await confirm({
            message:"you are already logged in. Do you want to login again",
            initialValue:false
        })

        if(isCancel(shouldReAuth) || !shouldReAuth){
            cancel("login cancelled");
            process.exit(0);
        }
    }
    const authClient=createAuthClient({
        baseURL:serverUrl,
        plugins:[deviceAuthorizationClient()]
    })

    const spinner=yoctoSpinner({text:"requesting device authorization"})
    spinner.start();


    try {
        const {data,error}=await authClient.device.code({
            client_id:clientId,
            scope:"openid profile email"
        })
        spinner.stop()
        if(error || !data){
            logger.error(
                `failed to request device authorization: ${error.error_description}`
            )
            process.exit(1)
        }

        const {
            device_code,
            user_code,
            verification_uri,
            verification_uri_complete,
            interval=5,
            expires_in,
        }=data;
        console.log(chalk.cyan("device authorization is required"));

        console.log(`please visit ${chalk.underline.blue(verification_uri || verification_uri_complete)}`);
        console.log(`enter code: ${chalk.bold.green(user_code)}`)
        const shouldOpen=await confirm({
            message:"open browser automatically",
            initialValue:true
        })

        if(!isCancel(shouldOpen) && shouldOpen){
            const urlToOpen=verification_uri || verification_uri_complete;
            await open(urlToOpen)
        }

        console.log(
            chalk.gray(
                `waiting for authentication (expires in ${Math.floor(expires_in/60)} minutes)...`
            )
        );
    } catch (error) {
        
    }
}



// COMMANDER SETUP

export const login=new Command("login")
.description("login to better Auth")
.options("--server-url <url>","the better auth server URL",serverURL)
.option("--client-id <id>","the oauth client Id",CLIENT_ID)
.action(loginAction)