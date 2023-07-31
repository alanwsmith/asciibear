import asyncio
import iterm2
import websockets

async def main(connection):
    queue = asyncio.Queue()
    task_holder = []
    a = asyncio.create_task(watchit(connection, queue))
    b = asyncio.create_task(sendit(queue))

async def watchit(connection, queue):
    async with iterm2.KeystrokeMonitor(connection) as mon:
        while True:
            thekey = await mon.async_get()
            print("got key")
            queue.put_nowait("ping")

async def sendit(queue):
    async with websockets.connect("ws://localhost:5757/wskeys") as websocket:
        while True:
            ping = await queue.get()
            hitit = await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')
            print("sent key")

iterm2.run_forever(main, True)

