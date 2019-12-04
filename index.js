const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const sqlite = require('sqlite')
const dbConnnection = sqlite.open('banco.sqlite', { Promise })

const port = process.env.PORT || 3000

app.set('view engine','ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

//------------------ Main routes------------------------------
app.get('/',async(request, response) => {
    const db = await dbConnnection
    const categoriasDb = await db.all('select * from categorias')
    const vagasDb = await db.all('select * from vagas')
    const categorias = categoriasDb.map( cat =>{
        return {
            ...cat,
            vagas: vagasDb.filter( vaga => vaga.categoria === cat.id)
        }
    })

    response.render('home',{
        categorias
    })
})

app.get('/vaga/:id',async(request,response)=>{
    const { id } = request.params
    const db = await dbConnnection
    const vaga = await db.get('select * from vagas where id ='+id)
    response.render('vaga', {
        vaga
    })
})
//---------------- Admin routes-----------------------------
app.get('/admin', (request, response)=>{
    response.render('admin/home')
})

app.get('/admin/vagas', async(req, res)=>{
    const db = await dbConnnection
    const vagas = await db.all('select * from vagas')
    res.render('admin/vagas',{ vagas } )
})

app.get('/admin/vagas/delete/:id', async(req, res)=>{
    const { id } = req.params
    const db = await dbConnnection
    await db.run('delete from vagas where id = '+ id)
    res.redirect('/admin/vagas')
})
app.get('/admin/vagas/create', async(req, res)=>{
    const db = await dbConnnection
    const categorias = await db.all('select * from categorias')
    res.render('admin/nova-vaga', {
        categorias
    })
})

app.post('/admin/vagas/create', async(req, res)=>{
    const { titulo, descricao, categoria} = req.body
    const db = await dbConnnection
    await db.run(`insert into vagas(titulo, descricao, categoria) values('${titulo}','${descricao}',${categoria})`)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/update/:id', async(req, res)=>{
    const { id } = req.params
    const db = await dbConnnection
    const vaga = await db.get('select * from vagas where id = '+ id)
    const categorias = await db.all('select * from categorias')
    res.render('admin/edit-vaga',{
        vaga, categorias
    })
})

app.post('/admin/vagas/update/:id', async(req, res)=>{
    const { id, titulo, descricao, categoria } = req.body
    const db = await dbConnnection
    await db.run(`update vagas set titulo = '${titulo}', descricao = '${descricao}', categoria = ${categoria} where id = ${id}`)
    res.redirect('/admin/vagas')
})

app.get('/admin/categorias', async(req, res)=>{
    const db = await dbConnnection
    const categorias = await db.all('select * from categorias')
    res.render('admin/categorias', { categorias })
})
app.get('/admin/categorias/delete/:id', async(req, res)=>{
    const id = req.params.id
    const db = await dbConnnection
    await db.run('delete from categorias where id = '+id)
    res.redirect('/admin/categorias')
})
app.get('/admin/categorias/create',(req, res)=>{
    res.render('admin/nova-categoria')
})
app.post('/admin/categorias/create', async(req, res)=>{
    const { categoria } = req.body
    const db = await dbConnnection
    await db.run(`insert into categorias(categoria) values('${categoria}')`)
    res.redirect('/admin/categorias')
})
app.get('/admin/categorias/update/:id', async (req, res)=>{
    const id = req.params.id
    const db = await dbConnnection
    const categoria = await db.get('select * from categorias where id = '+id)
    res.render('admin/edit-categoria', { categoria })
})
app.post('/admin/categorias/update/:id', async(req, res)=>{
    const { id , categoria } = req.body
    const db = await dbConnnection
    await db.run(`update categorias set categoria = '${categoria}' where id = ${id}`)
    res.redirect('/admin/categorias')
})
//----------------DataBase Creation-----------------------
const init = async() =>{
    const db = await dbConnnection
    await db.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')
    //const categoria = 'Marketing Team'
    //await db.run(`insert into categorias (categoria) values('${categoria}');`)
    //const categoriaNumber = 2
    //const titulo = 'Marketing Leader'
    //const descricao = 'Requirements: much certifications about marketing'
    //await db.run(`insert into vagas (categoria, titulo, descricao) values(${categoriaNumber}, '${titulo}', '${descricao}');`)
}
init()
//-------------------Application Listening-------------------
app.listen(port, (err) => {
    if(err){
        console.log('Erro na aplicação: '+err)
    }else{
        console.log('Iniciando a aplicação...')
    }
})