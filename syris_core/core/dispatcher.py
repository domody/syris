from syris_core.llm.processors.intent_parser import IntentParser
from syris_core.llm.processors.response_composer import ResponseComposer
from syris_core.types.events import Event

class Dispatcher:
    def __init__(self, intent_parser: IntentParser, response_composer: ResponseComposer):
        self.intent_parser = intent_parser
        self.response_composer = response_composer

    async def process_input(self, event: Event):
        text = event.payload["text"]

        # Return intent
        intent = await self.intent_parser.parse(text)

        # Create response based on intent
        response = await self.response_composer.compose(intent=intent, user_input=text)
        return response