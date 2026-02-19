from ollama import ChatResponse

def get_message_content(response: ChatResponse) -> str:
    message = response.message
    content = message.content

    if content:
        return content.strip()
    else:
        return ""