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
    Text,
    IssueAction,
    Table, Heading, TextField, useProductContext, DatePicker
} from "@forge/ui";
import api, {properties, asApp, asUser, route, requestJira} from '@forge/api';
import { view } from '@forge/bridge';


const CreateProjectInContract = () => {
  const [isOpen, setOpen] = useState(true);
  let newProjectName = "ProjectName";

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
              "name": "Parent"
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
    const [companyDocuments] = useState(async () =>  {
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
        let issues = (await response.json()).issues;

        if (issues !== undefined) {
            return issues.map(issue => <Option label={issue.fields.summary} value={issue.key} />);
        }

        return null;
    });

    const [currencyValues] = useState(async () => {
        const fieldsResponse = await api.asUser().requestJira(route`/rest/api/3/field`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        const currencyField = (await fieldsResponse.json()).filter(field => field.name === "Currency").shift();

        const customFieldContexts = await api.asUser().requestJira(route`/rest/api/3/field/${currencyField.id}/context`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const optionsContextId =  Number((await customFieldContexts.json()).values[0].id);

        const optionsResponse = await api.asUser().requestJira(route`/rest/api/3/field/${currencyField.id}/context/${optionsContextId}/option`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        return (await optionsResponse.json()).values.map(value => <Option label={value.value} value={value.id} />);
    });

    const developers_company = "developers_company";
    const developer_fio = "developer_fio";
    const developer_email = "developer_email";
    const developer_role = "developer_role";
    const currency = "currency";
    const rate_buy = "rate_buy";
    const rate_sell = "rate_sell";
    const resource_start = "resource_start";
    const resource_end = "resource_end";
    const manager_fio = "manager_fio";
    const manager_email = "manager_email";

    if (!isOpen) {
        return null;
    }

    const onSubmit = async data => {
        const context = useProductContext();

        const issueTypeResponse = await api.asApp().requestJira(route`/rest/api/3/issuetype`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const developerIssueType = (await issueTypeResponse.json()).filter(issue => issue.name === "Developer").shift();

        const fieldsResponse = await api.asUser().requestJira(route`/rest/api/3/field`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const developerFioField = (await fieldsResponse.json()).filter(field => field.name === "Developer FIO").shift();
        const developerEmailField = (await fieldsResponse.json()).filter(field => field.name === "Developer Email").shift();
        const developerRoleField = (await fieldsResponse.json()).filter(field => field.name === "Developer Role").shift();
        const currencyField = (await fieldsResponse.json()).filter(field => field.name === "Currency").shift();
        const rateBuyField = (await fieldsResponse.json()).filter(field => field.name === "Developer Buy Rate").shift();
        const rateSellField = (await fieldsResponse.json()).filter(field => field.name === "Developer Sell Rate").shift();
        const resourceStartDateField = (await fieldsResponse.json()).filter(field => field.name === "Resource Period. Date Start").shift();
        const resourceEndDateField = (await fieldsResponse.json()).filter(field => field.name === "Resource Period. Date End").shift();
        const managerFioField = (await fieldsResponse.json()).filter(field => field.name === "Manager FIO").shift();
        const managerEmailField = (await fieldsResponse.json()).filter(field => field.name === "Manager email").shift();

        let createDeveloperIssueBody = `{
          "fields": {
              "summary": "${data.developer_fio}",
              "project": {
                  "id": "${context.platformContext.projectId}"
              },
              "issuetype": {
                  "id": "${developerIssueType.id}"
              },
              "reporter": {
                  "id": "${context.accountId}"
              },
              "${developerFioField.id}": "${data.developer_fio}",
              "${developerEmailField.id}": "${data.developer_email}",
              "${developerRoleField.id}": "${data.developer_role}",
              "${currencyField.id}": {
                "id": "${data.currency}"
              },
              "${rateBuyField.id}": ${data.rate_buy},
              "${rateSellField.id}": ${data.rate_sell},
              "${resourceStartDateField.id}": "${data.resource_start}",
              "${resourceEndDateField.id}": "${data.resource_end}",
              "${managerFioField.id}": "${data.manager_fio}",
              "${managerEmailField.id}": "${data.manager_email}"
          }
      }`;

        const createdDeveloperIssueResponse = await api.asUser().requestJira(route`/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: createDeveloperIssueBody
        });


        let createIssueLinksBody = {
            "outwardIssue": {
                "key": (await createdDeveloperIssueResponse.json()).key
            },
            "inwardIssue": {
                "key": context.platformContext.issueKey
            },
            "type": {
                "name": "Parent"
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

        let createContractLink = {
            "outwardIssue": {
                "key": data.developers_company
            },
            "inwardIssue": {
                "key": (await createdDeveloperIssueResponse.json()).key
            },
            "type": {
                "name": "Relates"
            }
        };

        await api.asUser().requestJira(route`/rest/api/3/issueLink`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(createContractLink)
        });

        setOpen(false);
    };

    return (
      <ModalDialog header={"Creating Developer in Contract"} onClose={() => setOpen(false)}>
          <Form onSubmit={onSubmit}>
              <Select label={"Select contract from documents"} name={developers_company} isRequired={true}>
                  {companyDocuments}
              </Select>
              <TextField label={"Developer FIO"} name={developer_fio} isRequired={true} />
              <TextField label={"Developer Email"} name={developer_email} type={"email"} isRequired={true} />
              <TextField label={"Developer Role"} name={developer_role} isRequired={true} />
              <Select label={"Currency"} name={currency} isRequired={true}>
                  {currencyValues}
              </Select>
              <TextField label={"Buy rate"} name={rate_buy} type={"number"} isRequired={true} />
              <TextField label={"Sell rate"} name={rate_sell} type={"number"} isRequired={true} />
              <DatePicker label={"Resource start"} name={resource_start} isRequired={true} />
              <DatePicker label={"Resource end"} name={resource_end} isRequired={true} />
              <TextField label={"Manager FIO"} name={manager_fio} isRequired={true} />
              <TextField label={"Manager email"} name={manager_email} type={"email"} isRequired={true} />
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