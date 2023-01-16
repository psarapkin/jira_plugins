import ForgeUI, {
    Select,
    Form,
    Option,
    AdminPage,
    render,
    useAction,
    Checkbox,
    CheckboxGroup,
    useState,
    ModalDialog,
    IssueContext,
    Text,
    IssueAction,
    Table, Heading, TextField, useProductContext
} from "@forge/ui";
import api, {properties, asApp, asUser, route, requestJira} from '@forge/api';
import { view } from '@forge/bridge';

export const run = args => {
  [issue] = args.issue;


  return {
    result: result,
    errorMessage: `Issue ${issue.key} is not ready for transition from status ${from.id} to ${to.id}`,
  }
};


const CreateProjectInContract = () => {
  const [isOpen, setOpen] = useState(true);
  let newProjectName = "ProjectName";


    const [issuesFromDocs] = useState(async () => {
      var bodyData = {
          "expand": [
            "names",
            "schema",
            "operations"
          ],
          "jql": "project = DOC",
          "maxResults": 50,
          "fieldsByKeys": false,
          "fields": [
            "summary",
            "status",
            "assignee"
          ],
          "startAt": 0
        };

      const response = await api.asUser().requestJira(route`/rest/api/3/search`, {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyData)
      });

      return (await response.json()).issues.map(issue => <Option label={issue.fields.summary} value={issue.key} />);
  });



/*
* Создаем новый проект, параметры
* ProjectName - имя проекта
* Link - с типом Parent-Child на Issue с типом контракт
* */

  const onSubmit = async data => {
      const context = useProductContext();

      const issueTypeResponse = await api.asApp().requestJira(route`/rest/api/3/issuetype`, {
          headers: {
              'Accept': 'application/json'
          }
      });

      const projectIssueType = (await issueTypeResponse.json()).filter(issue => issue.name === "Project").shift();

      let createProjectIssueBody = `{
          "fields": {
              "summary": "${data.ProjectName}",
              "project": {
                  "id": "${context.platformContext.projectId}"
              },
              "issuetype": {
                  "id": "${projectIssueType.id}"
              },
              "reporter": {
                  "id": "${context.accountId}"
              }
          }
      }`;

      const createdProjectIssueResponse = await api.asUser().requestJira(route`/rest/api/3/issue`, {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          body: createProjectIssueBody
      });

      let createIssueLinksBody = {
          "outwardIssue": {
            "key": context.platformContext.issueKey
          },
          "inwardIssue": {
            "key": (await createdProjectIssueResponse.json()).key
          },
          "type": {
              "name": "Parent Link"
          }
      };

      const response = await api.asUser().requestJira(route`/rest/api/3/issueLink`, {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(createIssueLinksBody)
      });

      setOpen(false);
  } ;

  if (!isOpen) {
    return null;
  }


  return (
      <ModalDialog header="Creating Project in Contract" onClose={() => setOpen(false)}>
        <Form onSubmit={onSubmit}>
            <TextField name={newProjectName} label={newProjectName} />

        </Form>
      </ModalDialog>
  );
};

export const createProject = render(
    <IssueAction>
      <CreateProjectInContract />
    </IssueAction>
);