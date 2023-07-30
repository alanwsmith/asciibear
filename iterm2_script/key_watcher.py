import asyncio
import iterm2
import websockets

async def main(connection):
    async with iterm2.KeystrokeMonitor(connection) as mon:
        while True:
            thekey = await mon.async_get()
            print(thekey)
            await sendit()

            # async for websocket in websockets.connect("ws://127.0.0.1:5757/ws"):
            #     await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')
            #  # websocket.close()

    print("HERERER")



   # with websocket if websockets.connect("ws://127.0.0.1:5757/ws")
    # async with iterm2.KeystrokeMonitor(connection) as mon:
    #     while True:
    #         await mon.async_get()
    #         await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')
            # with websockets.connect("ws://127.0.0.1:5757/ws") as websocket:
                # await websocket.close()

        # async for websocket in websockets.connect("ws://127.0.0.1:5757/ws"):
        #     try:
        # async for websocket in websockets.connect("ws://127.0.0.1:5757/ws"):
        #     try:
        #         while True:
        #             await mon.async_get()
        #             await websocket.send('{ "type": "key", "vadlue": "HIDDEN_FOR_SECURITY"}')
        #     except websockets.ConnectionClosed:
        #         continue


async def sendit():
    async with websockets.connect("ws://localhost:5757/ws") as websocket:
        # await websocket.send("Hello world!")
        await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')
        await websocket.recv()

# async def send2():
#     async with websockets.sync.client.connect as wee:
#         pass


    # with websockets.connect("ws://127.0.0.1:5757/ws") as websocket:
    #     await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')

    # async for websocket in websockets.connect("ws://127.0.0.1:5757/ws"):
    #     await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')
    #     await websocket.close()





#async def send_keyalert(): 
#    #with websockets.connect("ws://127.0.0.1:5757/ws") as websocket:
#        await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')
#        await websocket.close()
            

iterm2.run_until_complete(main, True)
