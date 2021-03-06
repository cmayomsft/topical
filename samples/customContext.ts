import { TurnContext, MemoryStorage, ConsoleAdapter } from 'botbuilder';
import { Topic, TextPrompt, prettyConsole, WSTelemetry, consoleOnTurn, doTopic, PromptArgs } from '../src/topical';

class CustomContext extends TurnContext {
    foo = "hey"
}

class Child extends Topic<any, any, any, any, CustomContext> {

    async onBegin() {
        await this.context.sendActivity(this.context.foo);
        this.returnToParent();
    }
}

class PromptForText extends TextPrompt<PromptArgs, CustomContext> {

    prompter = async () => {
        await this.context.sendActivity(this.context.foo);
        await this.context.sendActivity(this.state.args!.prompt!);
    }
}

class Root extends Topic<any, any, any, any, CustomContext> {

    static subtopics = [Child, PromptForText];

    async onBegin() {
        this.beginChild(Child);
    }

    async onTurn() {
        await this.dispatchToChild();
    }

    async onChildReturn(child: Topic) {
        if (child instanceof Child) {
            await this.context.sendActivity(this.context.foo);
            this.beginChild(PromptForText, {
                prompt: 'Wassup?',
            });
        } else if (child instanceof PromptForText) {
            await this.context.sendActivity(`You said ${child.return!.result.value}`);
            this.clearChildren();
        } else
            throw "mystery child topic";
    }

}



// const wst = new WSTelemetry('ws://localhost:8080/server');
// Topic.telemetry = action => wst.send(action);

Topic.init(new MemoryStorage());

consoleOnTurn(
    new ConsoleAdapter()
        .use(prettyConsole),
    context => doTopic(Root, new CustomContext(context))
);