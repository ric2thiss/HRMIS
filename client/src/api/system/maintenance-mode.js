import api from '../axios'

const isSystemUp = async() => {
        await api.get('/maintenance-mode')

}