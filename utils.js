/*Source: https://github.com/HanGuo97/hanguo97.github.io/blob/master/utils.js*/
function createProjectElement(id, project) {
    /* Create an element in Project
    tag: some tags
    title: title of the project or publications
    paper_url: link to the paper
    authors: authors
    conference: publication venue
    image (optional): directory to project image
    others (optional): anything else
    */
    if (project.tag == null)
        project.tag = id;
    if (project.others == null)
        project.others = "";

    let conference_str = project.conference != null ?
        `<br>\n<a href="${project.conference_link != null ? project.conference_link : ''}"><em>${project.conference}</em></a>` : "";
    let code_str = project.code != null ?
        `<br>\n[<a href="${project.code}">Code</a>]` : "";

    html_img = `<img src='${project.image}' style="max-width: 160px"></div></div>`;
    html_txt = `<p>
      <a href="${project.paper_url}"><papertitle>${project.title}</papertitle></a>
      <br>
      ${project.authors}
      ${conference_str}
      ${code_str}
      ${project.others}`;

    document.getElementById(id + "-img").innerHTML = html_img;
    document.getElementById(id + "-txt").innerHTML = html_txt;
}