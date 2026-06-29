import chalk from "chalk";
import boxen from "boxen";
import {text,isCancel,cancel,intro,outro} from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import {marked} from "marked"
import {markedTerminal} from "marked-terminal";
import {AIService} from "../ai/google-service.js";
import {ChatService} from "../../service/chat.service.js";
import {getStoredToken} from "../commands/auth/login.js";
import prisma from "../../lib/db.js"

const aiService=new AIService()
const chatService=new ChatService()

async function getUserFromToken(){
    const token=await getStoredToken()
    if(!token.accessToken){
        throw new Error("not authentication please run orbitals login first");

    }
    const spinner=yoctoSpinner({text:"Authenticating"}).start();
    const user=await prisma.user.findFirst({
        where:{
            sessions:{
                some:{token:token.access_token},
            },
        },
    })
    if(!user){
        spinner.error("user not found")
        throw new Error("user not found please login again");

    }
    spinner.success(`welcome back, ${user.name}!`)
    return user
}

async function initConversation(userId,conversationId=null,mode=chat){
    const spinner=yoctoSpinner({text:"loading conversation..."}).start();
    const conversation=await chatService.getOrCreateConversation(
        userId,
        conversationId,
        mode
    )
    spinner.success("Conversation loaded")
     const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💬 Chat Session",
      titleAlignment: "center",
    }
  );
    console.log(conversationInfo)

    if(conversation.messages?.length>0){
        console.log(chalk.yellow("previous messages"));
        deisplayMessages(conversation.messages);
    }

    return conversation
}


function displayMessages(messages) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "👤 You",
        titleAlignment: "left",
      });
      console.log(userBox);
    } else {
      // Render markdown for assistant messages
      const renderedContent = marked.parse(msg.content);
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant",
        titleAlignment: "left",
      });
      console.log(assistantBox);
    }
  });
}

async function saveMessage(conversationId,role,content){
    return await chatService.addMessage(conversationId,role,content)
}

export async function StartChat(mode="chat",conversationId=null){
    try {
        intro(
            boxen(chalk.bold.cyan("PHOENIX AI CHAT"),{
                padding:1,
                borderStyle:"double",
                borderColor:"cyan"
            })
        )

        const user=await getUserFromToken()
        const conversation=await initConversation(user.id,conversationId,mode);
        await chatLoop(conversation)

        outro(chalk.green("Thnaks for chatting"))
    } catch (error) {
        const errorBox=boxen(chalk.red(`error: ${error.message}`),{
            padding:1,
            margin:1,
            borderStyle:"round",
            borderColor:"red",
        });
        console.log(errorBox);
        process.exit(1);
    }
}