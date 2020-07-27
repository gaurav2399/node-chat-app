const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.getElementById('send-location')
const $message = document.querySelector('#message')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// universal method location that extract query parameter
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

// scroll to bottom when user screen is at latest view 
// and not scroll when user check history or not at latest view
const autoScroll = () => {
    // new message 
    const $newMessage = $message.lastElementChild

    // get object of all styling apply on newMessage
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // height visible to user
    const visibleHeight = $message.offsetHeight
    // tottal height of messages
    const conatinerHeight = $message.scrollHeight

    // how much scroll
    const scrollOffset = $message.scrollTop + visibleHeight

    if(conatinerHeight - newMessageHeight <= scrollOffset){
        $message.scrollTop = $message.scrollHeight
    }
}

socket.on('locationMessage',(url) => {
    console.log(url)

    const html = Mustache.render(locationTemplate,{
        username:url.username,
        location:url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML("beforeend",html)
    autoScroll()
})

socket.on('message',(message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        time:moment(message.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML("beforeend",html)
    autoScroll()
})

socket.on('roomData',({ room, users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    const data = e.target.elements.message.value
    socket.emit('sendMessage',data,(e) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(e){
            return console.log(e)
        }
        console.log('Delivered!!')
    })
})

$sendLocation.addEventListener('click',() => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported on your browser!')
    }

    $sendLocation.setAttribute('disabled','disabled')

    const data = navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        socket.emit('location',{
            latitude:latitude,
            longitude:longitude
        },() => {
            $sendLocation.removeAttribute('disabled')
            console.log('Location shared!!')
        })
    })
})

socket.emit('join',{ username, room},(error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})