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
    Table, Heading, TextField, useProductContext, DatePicker
} from "@forge/ui";
import api, {properties, asApp, asUser, route, requestJira} from '@forge/api';
import { view } from '@forge/bridge';


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

      await api.asUser().requestJira(route`/rest/api/3/issueLink`, {
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

const CreateDeveloperInProject = () => {
    const [isOpen, setOpen] = useState(true);

    const developers_company = "developers_company";
    const developer_fio = "developer_fio";
    const developer_email = "developer_email";
    const currency = "currency";
    const rate_buy = "rate_buy";
    const rate_sell = "rate_sell";
    const resource_start = "resource_start";
    const resource_end = "resource_end";
    const manager_fio = "manager_fio";
    const manager_email = "manager_email";

    const companyDocuments = useState(async () => {
        var bodyData = `
            {
              "expand": [
                  "names",
                  "schema",
                  "operations"
              ],
              "jql": "project = DOC and issuetype = Contract",
              "maxResults": 50,
              "fieldsByKeys": false,
              "fields": [
                "summary",
                "status",
                "assignee"
              ],
              "startAt": 0
        }`;

        const response = await api.asUser().requestJira(route`/rest/api/3/search`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: bodyData
        });

        return (await response.json()).map(issue => <Option label={issue.fields.summary} value={issue.key} />);

    });


    if (!isOpen) {
        return null;
    }

    const onSubmit = async data => {
        const context = useProductContext();



        setOpen(false);
    };

    return (
      <ModalDialog header={"Creating Developer in Contract"} onClose={() => setOpen(false)}>
          <Form onSubmit={onSubmit}>
              <Select label={"Select contract from documents"} name={developers_company}>
                  {companyDocuments}
              </Select>
              <TextField name={"Developer FIO"} label={developer_fio} />
              <TextField name={"Developer Email"} label={developer_email} type={"email"} />
              <Select label={"Currency"} name={currency}>
                  <Option label={"RUB"} value={"RUB"} />
                  <Option label={"USD"} value={"USD"} />
                  <Option label={"EUR"} value={"EUR"} />
              </Select>
              <TextField name={"Buy rate"} label={rate_buy} type={"number"} />
              <TextField name={"Sell rate"} label={rate_sell} type={"number"} />
              <DatePicker name={"Resource start"} label={resource_start} />
              <DatePicker name={"Resource end"} label={resource_end} />
              <TextField name={"Manager FIO"} label={manager_fio} />
              <TextField name={"Manager email"} label={manager_email} type={"email"} />
          </Form>
      </ModalDialog>
    );
};

export const createProject = render(
    <IssueAction>
      <CreateProjectInContract />
    </IssueAction>
);

export const createDeveloper = render(
  <IssueAction>
      <CreateDeveloperInProject />
  </IssueAction>
);