//知乎网站爬虫【初级版本】
let rp = require('request-promise')
let cheerio = require('cheerio')
let MongoClient = require('mongodb').MongoClient
let htmlDecode = require('./htmlDecode')


async function getQuestion(db, id) {
    let res = await rp({
        uri: `https://www.zhihu.com/question/${id}`
    })
    let $ = cheerio.load(res)
    let data = $('#data').attr('data-state')
    let state = JSON.parse(htmlDecode(data))
    let question = state.entities.questions[id]

    db.collection("questions").insert(question)
    await getAnswers(db, id, question.answerCount)
    console.log(id + ":insert db succ 200", `https://www.zhihu.com/question/${id}`)

}

async function getAnswers(db, id, answerCount) {
    for (let offset = 0; offset < answerCount; offset += 20) {
        let res = await rp({
            uri: `https://www.zhihu.com/api/v4/questions/${id}/answers?include=data%5B*%5D.is_normal%2Cadmin_closed_comment%2Creward_info%2Cis_collapsed%2Cannotation_action%2Cannotation_detail%2Ccollapse_reason%2Cis_sticky%2Ccollapsed_by%2Csuggest_edit%2Ccomment_count%2Ccan_comment%2Ccontent%2Ceditable_content%2Cvoteup_count%2Creshipment_settings%2Ccomment_permission%2Ccreated_time%2Cupdated_time%2Creview_info%2Cquestion%2Cexcerpt%2Crelationship.is_authorized%2Cis_author%2Cvoting%2Cis_thanked%2Cis_nothelp%2Cupvoted_followees%3Bdata%5B*%5D.mark_infos%5B*%5D.url%3Bdata%5B*%5D.author.follower_count%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics&offset=${offset}&limit=20&sort_by=created`,
            headers: {
                authorization: 'oauth c3cef7c66a1843f8b3a9e6a1e3160e20'
            }
        })
        let answer = JSON.parse(res).data
        db.collection("answers").insertMany(answer)
    }
}

async function main() {
    let db_url = 'mongodb://localhost:27017/db_zhihu'
    let db = await MongoClient.connect(db_url)
    let s_id = 31894251
    let e_id = 31894253
    for (let id = s_id; id < e_id; id++) {
        try {
            await getQuestion(db, id);
        } catch (err) {
            console.warn(id + ":insert db fail 404", `https://www.zhihu.com/question/${id}`)
        }
    }
}

main().catch(err => console.log(err))

