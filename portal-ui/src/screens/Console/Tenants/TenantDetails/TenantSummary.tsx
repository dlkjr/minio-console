// This file is part of MinIO Console Server
// Copyright (c) 2021 MinIO, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import get from "lodash/get";
import { Theme } from "@mui/material/styles";
import createStyles from "@mui/styles/createStyles";
import withStyles from "@mui/styles/withStyles";
import {
  containerForHeader,
  tenantDetailsStyles,
} from "../../Common/FormComponents/common/styleLibrary";
import { Box, Grid } from "@mui/material";
import UpdateTenantModal from "./UpdateTenantModal";
import { AppState, useAppDispatch } from "../../../../store";
import AButton from "../../Common/AButton/AButton";
import SummaryUsageBar from "../../Common/UsageBarWrapper/SummaryUsageBar";
import LabelValuePair from "../../Common/UsageBarWrapper/LabelValuePair";
import FormSwitchWrapper from "../../Common/FormComponents/FormSwitchWrapper/FormSwitchWrapper";
import SectionTitle from "../../Common/SectionTitle";
import RBIconButton from "../../Buckets/BucketDetails/SummaryItems/RBIconButton";
import { EditIcon } from "../../../../icons";
import EditDomains from "./EditDomains";
import { ITenant } from "../ListTenants/types";
import { useParams } from "react-router-dom";
import { getTenantAsync } from "../thunks/tenantDetailsAsync";

interface ITenantsSummary {
  classes: any;
}

const styles = (theme: Theme) =>
  createStyles({
    ...tenantDetailsStyles,
    redState: {
      color: theme.palette.error.main,
      "& .min-icon": {
        width: 16,
        height: 16,
        marginRight: 4,
      },
    },
    yellowState: {
      color: theme.palette.warning.main,
      "& .min-icon": {
        width: 16,
        height: 16,
        marginRight: 4,
      },
    },
    greenState: {
      color: theme.palette.success.main,
      "& .min-icon": {
        width: 16,
        height: 16,
        marginRight: 4,
      },
    },
    greyState: {
      color: "grey",
      "& .min-icon": {
        width: 16,
        height: 16,
        marginRight: 4,
      },
    },
    detailSection: {
      "& div": {
        "& b,i": {
          minWidth: 80,
          display: "block",
          float: "left",
        },
        "& i": {
          fontStyle: "normal",
          wordWrap: "break-word",
          overflowWrap: "break-word",
        },
        "& div": {
          clear: "both",
        },
        clear: "both",
        marginBottom: 2,
      },
    },
    linkedSection: {
      color: theme.palette.info.main,
      fontFamily: "'Lato', sans-serif",
    },
    autoGeneratedLink: {
      fontStyle: "italic",
    },
    ...containerForHeader(theme.spacing(4)),
  });

const healthStatusToClass = (health_status: string = "red", classes: any) => {
  return health_status === "red"
    ? classes.redState
    : health_status === "yellow"
    ? classes.yellowState
    : health_status === "green"
    ? classes.greenState
    : classes.greyState;
};

const StorageSummary = ({
  tenant,
  classes,
}: {
  tenant: ITenant | null;
  classes: any;
}) => {
  if (!tenant) {
    return null;
  }

  return (
    <SummaryUsageBar
      tenant={tenant!}
      label={"Storage"}
      error={""}
      loading={false}
      healthStatus={healthStatusToClass(tenant?.status?.health_status, classes)}
    />
  );
};

const getToggle = (toggleValue: boolean, idPrefix = "") => {
  return (
    <FormSwitchWrapper
      indicatorLabels={["Enabled", "Disabled"]}
      checked={toggleValue}
      value={toggleValue}
      id={`${idPrefix}-status`}
      name={`${idPrefix}-status`}
      onChange={() => {}}
      switchOnly
    />
  );
};

const featureRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "10px",
  "@media (max-width: 600px)": {
    flexFlow: "column",
  },
};

const featureItemStyleProps = {
  stkProps: {
    sx: {
      flex: 1,
      marginRight: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      "@media (max-width: 900px)": {
        marginRight: "25px",
      },
    },
  },
  lblProps: {
    style: {
      minWidth: 100,
    },
  },
};
const TenantSummary = ({ classes }: ITenantsSummary) => {
  const dispatch = useAppDispatch();
  const { tenantName, tenantNamespace } = useParams();

  const tenant = useSelector((state: AppState) => state.tenants.tenantInfo);
  const logEnabled = useSelector((state: AppState) =>
    get(state.tenants.tenantInfo, "logEnabled", false)
  );
  const monitoringEnabled = useSelector((state: AppState) =>
    get(state.tenants.tenantInfo, "monitoringEnabled", false)
  );
  const encryptionEnabled = useSelector((state: AppState) =>
    get(state.tenants.tenantInfo, "encryptionEnabled", false)
  );
  const minioTLS = useSelector((state: AppState) =>
    get(state.tenants.tenantInfo, "minioTLS", false)
  );
  const adEnabled = useSelector((state: AppState) =>
    get(state.tenants.tenantInfo, "idpAdEnabled", false)
  );
  const oidcEnabled = useSelector((state: AppState) =>
    get(state.tenants.tenantInfo, "idpOidcEnabled", false)
  );

  const [poolCount, setPoolCount] = useState<number>(0);
  const [instances, setInstances] = useState<number>(0);
  const [volumes, setVolumes] = useState<number>(0);
  const [updateMinioVersion, setUpdateMinioVersion] = useState<boolean>(false);
  const [editDomainsOpen, setEditDomainsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (tenant) {
      setPoolCount(tenant.pools.length);
      setVolumes(tenant.total_volumes || 0);
      setInstances(tenant.total_instances || 0);
    }
  }, [tenant]);

  const closeEditDomainsModal = (refresh: boolean) => {
    setEditDomainsOpen(false);
    if (refresh) {
      dispatch(getTenantAsync());
    }
  };

  return (
    <Fragment>
      {updateMinioVersion && (
        <UpdateTenantModal
          open={updateMinioVersion}
          closeModalAndRefresh={(refresh: boolean) => {
            setUpdateMinioVersion(false);
            if (refresh) {
              dispatch(getTenantAsync());
            }
          }}
          idTenant={tenantName || ""}
          namespace={tenantNamespace || ""}
        />
      )}

      {editDomainsOpen && (
        <EditDomains
          open={editDomainsOpen}
          idTenant={tenantName || ""}
          namespace={tenantNamespace || ""}
          domains={tenant?.domains || null}
          closeModalAndRefresh={closeEditDomainsModal}
        />
      )}

      <SectionTitle separator={false}>Details</SectionTitle>

      <StorageSummary tenant={tenant} classes={classes} />

      <Grid container>
        <Grid item xs={12} sm={12} md={8}>
          <Grid item xs={12}>
            <LabelValuePair label={"State:"} value={tenant?.currentState} />
          </Grid>
          <Grid item xs={12}>
            <LabelValuePair
              label="MinIO:"
              value={
                <AButton
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "normal",
                    wordBreak: "break-all",
                  }}
                  onClick={() => {
                    setUpdateMinioVersion(true);
                  }}
                >
                  {tenant ? tenant.image : ""}
                </AButton>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <h3>
              Domains
              <RBIconButton
                icon={<EditIcon />}
                title={""}
                onClick={() => {
                  setEditDomainsOpen(true);
                }}
              />
            </h3>
          </Grid>
          <Grid item xs={12}>
            <LabelValuePair
              label={"Console:"}
              value={
                <Fragment>
                  {(!tenant?.domains?.console ||
                    tenant?.domains?.console === "") &&
                  !tenant?.endpoints?.console
                    ? "-"
                    : ""}

                  {tenant?.endpoints?.console && (
                    <Fragment>
                      <a
                        href={tenant?.endpoints?.console}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${classes.linkedSection} ${classes.autoGeneratedLink}`}
                      >
                        {tenant?.endpoints?.console || "-"}
                      </a>
                      <br />
                    </Fragment>
                  )}

                  {tenant?.domains?.console && tenant?.domains?.console !== "" && (
                    <a
                      href={tenant?.domains?.console || ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.linkedSection}
                    >
                      {tenant?.domains?.console || ""}
                    </a>
                  )}
                </Fragment>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <LabelValuePair
              label={`MinIO Endpoint${
                tenant?.endpoints?.minio &&
                tenant?.endpoints?.minio.length === 1
                  ? ""
                  : "s"
              }:`}
              value={
                <Fragment>
                  {!tenant?.domains?.minio && !tenant?.endpoints?.minio
                    ? "-"
                    : ""}
                  {tenant?.endpoints?.minio && (
                    <Fragment>
                      <a
                        href={tenant?.endpoints?.minio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${classes.linkedSection} ${classes.autoGeneratedLink}`}
                      >
                        {tenant?.endpoints?.minio || "-"}
                      </a>
                      <br />
                    </Fragment>
                  )}

                  {tenant?.domains?.minio &&
                    tenant.domains.minio.map((domain) => {
                      return (
                        <Fragment key={domain}>
                          <a
                            href={domain}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={classes.linkedSection}
                          >
                            {domain}
                          </a>
                          <br />
                        </Fragment>
                      );
                    })}
                </Fragment>
              }
            />
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <Grid item xs={12}>
            <LabelValuePair label={"Instances:"} value={instances} />
          </Grid>
          <Grid item xs={12}>
            <LabelValuePair
              label={"Clusters:"}
              value={poolCount}
              stkProps={{
                style: {
                  marginRight: 47,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <LabelValuePair
              label="Total Drives:"
              value={volumes}
              stkProps={{
                style: {
                  marginRight: 43,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <LabelValuePair
              label={"Write Quorum:"}
              value={
                tenant?.status?.write_quorum ? tenant?.status?.write_quorum : 0
              }
            />
          </Grid>
          <Grid item xs={12}>
            <LabelValuePair
              label={"Drives Online:"}
              value={
                tenant?.status?.drives_online
                  ? tenant?.status?.drives_online
                  : 0
              }
              stkProps={{
                style: {
                  marginRight: 8,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <LabelValuePair
              label={"Drives Offline:"}
              value={
                tenant?.status?.drives_offline
                  ? tenant?.status?.drives_offline
                  : 0
              }
              stkProps={{
                style: {
                  marginRight: 7,
                },
              }}
            />
          </Grid>
        </Grid>
      </Grid>

      <SectionTitle>Features</SectionTitle>
      <Box sx={{ ...featureRowStyle }}>
        <LabelValuePair
          orientation="row"
          label="Logs:"
          value={getToggle(logEnabled, "tenant-log")}
          {...featureItemStyleProps}
        />

        <LabelValuePair
          orientation="row"
          label={"AD/LDAP:"}
          value={getToggle(adEnabled, "tenant-sts")}
          {...featureItemStyleProps}
        />
        <LabelValuePair
          orientation="row"
          label={"Encryption:"}
          value={getToggle(encryptionEnabled, "tenant-enc")}
          {...featureItemStyleProps}
        />
      </Box>
      <Box sx={{ ...featureRowStyle }}>
        <LabelValuePair
          orientation="row"
          label="MinIO TLS:"
          value={getToggle(minioTLS, "tenant-tls")}
          {...featureItemStyleProps}
        />

        <LabelValuePair
          orientation="row"
          label={"Monitoring:"}
          value={getToggle(monitoringEnabled, "tenant-monitor")}
          {...featureItemStyleProps}
        />
        <LabelValuePair
          orientation="row"
          label={"OpenID:"}
          value={getToggle(oidcEnabled, "tenant-oidc")}
          {...featureItemStyleProps}
        />
      </Box>
    </Fragment>
  );
};

export default withStyles(styles)(TenantSummary);
